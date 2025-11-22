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
    private isDestroyed = false

    protected constructor(bridges: StreamTransportBridge[]) {
        this.bridges = bridges
    }

    public static Create(devices: DeviceStreamer[]) {
        const bridges = this.createBridgesFrom(devices)
        return new (this.Class ?? this)(bridges)
    }

    public open() {
        this.throwIfGatewayIsDestroyed()
        this.activateLslWebSocketBridges()
    }

    private throwIfGatewayIsDestroyed() {
        if (this.isDestroyed) {
            throw new Error(
                `\n\n Cannot re-open gateway after destroying it! \n\n Please create and open a new instance. \n`
            )
        }
    }

    private activateLslWebSocketBridges() {
        this.bridges.forEach((bridge) => bridge.activate())
    }

    public close() {
        this.deactivateLslWebSocketBridges()
    }

    private deactivateLslWebSocketBridges() {
        this.bridges.forEach((bridge) => bridge.deactivate())
    }

    public destroy() {
        this.destroyLslWebSocketBridges()
        this.isDestroyed = true
    }

    private destroyLslWebSocketBridges() {
        this.bridges.forEach((bridge) => bridge.destroy())
    }

    private static createBridgesFrom(devices: DeviceStreamer[]) {
        let currentWssPort = 8080

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

export type WebSocketGatewayConstructor = new (
    bridges: StreamTransportBridge[]
) => WebSocketGateway
