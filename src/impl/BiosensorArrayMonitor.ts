import {
    StreamInletOptions,
    StreamOutlet,
    LslWebSocketBridge,
    StreamTransportBridge,
} from '@neurodevs/node-lsl'

import { DeviceStreamer } from './BiosensorDeviceFactory.js'

export default class BiosensorArrayMonitor implements ArrayMonitor {
    public static Class?: ArrayMonitorConstructor

    private bridges: StreamTransportBridge[]

    protected constructor(bridges: StreamTransportBridge[]) {
        this.bridges = bridges
    }

    public static Create(devices: DeviceStreamer[]) {
        const bridges = this.createBridgesFrom(devices)
        return new (this.Class ?? this)(bridges)
    }

    public start() {
        this.bridges.forEach((bridge) => bridge.activate())
    }

    public stop() {
        this.bridges.forEach((bridge) => bridge.deactivate())
    }

    public destroy() {
        this.bridges.forEach((bridge) => bridge.destroy())
    }

    private static createBridgesFrom(devices: DeviceStreamer[]) {
        return devices.flatMap((device) => {
            return device.outlets.map((outlet) => {
                return this.createBridgeFrom(outlet)
            })
        })
    }

    private static createBridgeFrom(outlet: StreamOutlet) {
        const {
            sampleRateHz,
            channelNames,
            channelFormat,
            chunkSize,
            maxBufferedMs,
        } = outlet

        return this.LslWebSocketBridge({
            sampleRateHz,
            channelNames,
            channelFormat,
            chunkSize,
            maxBufferedMs,
        })
    }

    private static LslWebSocketBridge(options: StreamInletOptions) {
        return LslWebSocketBridge.Create(options)
    }
}

export interface ArrayMonitor {
    start(): void
    stop(): void
    destroy(): void
}

export type ArrayMonitorConstructor = new () => ArrayMonitor
