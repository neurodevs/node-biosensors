import WebSocket, { WebSocketServer } from 'ws'
import {
    LslOutlet,
    LslWebSocketBridge,
    LslWsBridge,
    LslWsBridgeOptions,
} from '@neurodevs/node-lsl'

import { DeviceController } from '../types.js'

export default class BiosensorWebSocketGateway implements WebSocketGateway {
    public static Class?: WebSocketGatewayConstructor
    public static WSS = WebSocketServer

    private bridges: readonly LslWsBridge[]
    private deviceStreams: readonly DeviceStreams[]
    private statusServer: WebSocketServer
    private unsubscribeFromDevices: (() => void)[]
    private isOpen = false
    private isDestroyed = false

    protected constructor(options: WebSocketGatewayConstructorOptions) {
        const { bridges, deviceStreams, statusServer } = options

        this.bridges = bridges
        this.deviceStreams = deviceStreams
        this.statusServer = statusServer

        this.statusServer.on('connection', (client) =>
            client.send(this.statusPayload)
        )

        this.unsubscribeFromDevices = deviceStreams.map(({ device }) =>
            device.addStateListener(() => this.broadcastStatus())
        )
    }

    public static async Create(
        devices: readonly DeviceController[],
        options?: WebSocketGatewayOptions
    ) {
        const { listenPortStart = 8080, statusPort = listenPortStart - 1 } =
            options ?? {}

        const { bridges, deviceStreams } = await this.createBridgesFrom(
            devices,
            listenPortStart
        )

        const statusServer = new this.WSS({ port: statusPort })

        return new (this.Class ?? this)({
            bridges,
            deviceStreams,
            statusServer,
        })
    }

    private broadcastStatus() {
        const payload = this.statusPayload

        for (const client of this.statusServer.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload)
            }
        }
    }

    private get statusPayload() {
        return JSON.stringify({
            devices: this.deviceStreams.map(({ device, listenPorts }) => ({
                state: device.state,
                listenPorts,
            })),
        })
    }

    public open() {
        if (!this.isOpen) {
            this.throwIfGatewayIsDestroyed(this.cannotOpenMessage)
            this.activateLslWebSocketBridges()
            this.isOpen = true
        } else {
            console.warn('Cannot open gateway because it is already open.')
        }
    }

    private throwIfGatewayIsDestroyed(err: string) {
        if (this.isDestroyed) {
            throw new Error(err)
        }
    }

    private readonly cannotOpenMessage = `\n\n Cannot open gateway after destroying it! \n\n Please create and open a new instance. \n`

    private activateLslWebSocketBridges() {
        this.bridges.forEach((bridge) => bridge.activate())
    }

    public close() {
        if (this.isOpen) {
            this.deactivateLslWebSocketBridges()
            this.isOpen = false
        } else {
            if (this.isDestroyed) {
                this.throwIfGatewayIsDestroyed(this.cannotCloseMessage)
            } else {
                console.warn('Cannot close gateway because it is not open.')
            }
        }
    }

    private readonly cannotCloseMessage = `\n\n Cannot close gateway after destroying it! \n\n Please create a new instance. \n`

    private deactivateLslWebSocketBridges() {
        this.bridges.forEach((bridge) => bridge.deactivate())
    }

    public destroy() {
        if (!this.isDestroyed) {
            this.closeGatewayIfOpenBeforeDestroying()
            this.destroyLslWebSocketBridges()
            this.stopServingDeviceStatus()
            this.isDestroyed = true
        } else {
            console.warn(
                'Cannot destroy gateway because it is already destroyed.'
            )
        }
    }

    private closeGatewayIfOpenBeforeDestroying() {
        if (this.isOpen) {
            this.close()
        }
    }

    private destroyLslWebSocketBridges() {
        this.bridges.forEach((bridge) => bridge.destroy())
    }

    private stopServingDeviceStatus() {
        this.unsubscribeFromDevices.forEach((unsubscribe) => unsubscribe())
        this.statusServer.close()
    }

    private static async createBridgesFrom(
        devices: readonly DeviceController[],
        listenPortStart: number
    ) {
        let currentListenPort = listenPortStart

        const bridges: LslWsBridge[] = []
        const deviceStreams: DeviceStreams[] = []

        for (const device of devices) {
            const listenPorts: number[] = []

            for (const outlet of device.outlets) {
                const listenPort = currentListenPort++
                const bridge = await this.createBridgeFrom(outlet, listenPort)

                bridges.push(bridge)
                listenPorts.push(listenPort)
            }

            deviceStreams.push({ device, listenPorts })
        }

        return { bridges, deviceStreams }
    }

    private static async createBridgeFrom(
        outlet: LslOutlet,
        listenPort: number
    ) {
        const { sourceId, chunkSize } = outlet

        return this.LslWebSocketBridge({
            sourceId,
            chunkSize,
            listenPort,
        })
    }

    private static async LslWebSocketBridge(options: LslWsBridgeOptions) {
        return LslWebSocketBridge.Create(options)
    }
}

export interface WebSocketGateway {
    open(): void
    close(): void
    destroy(): void
}

export interface WebSocketGatewayOptions {
    listenPortStart?: number
    statusPort?: number
}

export type WebSocketGatewayConstructor = new (
    options: WebSocketGatewayConstructorOptions
) => WebSocketGateway

export interface WebSocketGatewayConstructorOptions {
    bridges: readonly LslWsBridge[]
    deviceStreams: readonly DeviceStreams[]
    statusServer: WebSocketServer
}

export interface DeviceStreams {
    device: DeviceController
    listenPorts: readonly number[]
}
