import {
    StreamOutlet,
    LslWebSocketBridge,
    StreamTransportBridge,
    StreamTransportBridgeOptions,
} from '@neurodevs/node-lsl'

import { DeviceStreamer } from './BiosensorDeviceFactory.js'

export default class BiosensorWebSocketGateway implements WebSocketGateway {
    public static Class?: WebSocketGatewayConstructor

    private bridges: StreamTransportBridge[]
    private isOpen = false
    private isClosed = false
    private isDestroyed = false

    protected constructor(bridges: StreamTransportBridge[]) {
        this.bridges = bridges
    }

    public static Create(
        devices: DeviceStreamer[],
        options?: WebSocketGatewayOptions
    ) {
        const bridges = this.createBridgesFrom(devices, options)
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
        if (!this.isClosed) {
            this.throwIfGatewayIsDestroyed(this.cannotCloseMessage)
            this.deactivateLslWebSocketBridges()
            this.isOpen = false
            this.isClosed = true
        } else {
            console.warn('Cannot close gateway because it is already closed.')
        }
    }

    private readonly cannotCloseMessage = `\n\n Cannot close gateway after destroying it! \n\n Please create a new instance. \n`

    private deactivateLslWebSocketBridges() {
        this.bridges.forEach((bridge) => bridge.deactivate())
    }

    public destroy() {
        this.throwIfGatewayIsDestroyed(this.cannotDestroyMessage)
        this.destroyLslWebSocketBridges()
        this.isDestroyed = true
    }

    private readonly cannotDestroyMessage = `\n\n Cannot destroy gateway after destroying it! \n\n Please create a new instance. \n`

    private destroyLslWebSocketBridges() {
        this.bridges.forEach((bridge) => bridge.destroy())
    }

    private static createBridgesFrom(
        devices: DeviceStreamer[],
        options?: WebSocketGatewayOptions
    ) {
        const { wssPortStart = 8080 } = options ?? {}
        let currentWssPort = wssPortStart

        return devices.flatMap((device) => {
            return device.outlets.map((outlet) => {
                return this.createBridgeFrom(outlet, currentWssPort++)
            })
        })
    }

    private static createBridgeFrom(outlet: StreamOutlet, wssPort: number) {
        const { sampleRateHz, channelNames, channelFormat, chunkSize } = outlet

        return this.LslWebSocketBridge({
            sampleRateHz,
            channelNames,
            channelFormat,
            chunkSize,
            wssPort,
        })
    }

    private static LslWebSocketBridge(options: StreamTransportBridgeOptions) {
        return LslWebSocketBridge.Create(options)
    }
}

export interface WebSocketGateway {
    open(): void
    close(): void
    destroy(): void
}

export interface WebSocketGatewayOptions {
    wssPortStart?: number
}

export type WebSocketGatewayConstructor = new (
    bridges: StreamTransportBridge[]
) => WebSocketGateway
