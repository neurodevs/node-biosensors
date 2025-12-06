import {
    StreamOutlet,
    LslWebSocketBridge,
    WebSocketBridge,
    WebSocketBridgeOptions,
} from '@neurodevs/node-lsl'

import { DeviceStreamer } from './BiosensorDeviceFactory.js'

export default class BiosensorWebSocketGateway implements WebSocketGateway {
    public static Class?: WebSocketGatewayConstructor

    private bridges: WebSocketBridge[]
    private isOpen = false
    private isDestroyed = false

    protected constructor(bridges: WebSocketBridge[]) {
        this.bridges = bridges
    }

    public static async Create(
        devices: DeviceStreamer[],
        options?: WebSocketGatewayOptions
    ) {
        const bridges = await this.createBridgesFrom(devices, options)
        return new (this.Class ?? this)(bridges)
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

    private static async createBridgesFrom(
        devices: DeviceStreamer[],
        options?: WebSocketGatewayOptions
    ) {
        const { listenPortStart = 8080 } = options ?? {}
        let currentListenPort = listenPortStart

        const bridges: WebSocketBridge[] = []

        for (const device of devices) {
            for (const outlet of device.outlets) {
                const bridge = await this.createBridgeFrom(
                    outlet,
                    currentListenPort++
                )
                bridges.push(bridge)
            }
        }

        return bridges
    }

    private static async createBridgeFrom(
        outlet: StreamOutlet,
        listenPort: number
    ) {
        const { sourceId, chunkSize } = outlet

        return this.LslWebSocketBridge({
            sourceId,
            chunkSize,
            listenPort,
        })
    }

    private static async LslWebSocketBridge(options: WebSocketBridgeOptions) {
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
}

export type WebSocketGatewayConstructor = new (
    bridges: WebSocketBridge[]
) => WebSocketGateway
