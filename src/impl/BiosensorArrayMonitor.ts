import {
    StreamInletOptions,
    StreamOutlet,
    LslWebSocketBridge,
} from '@neurodevs/node-lsl'

import { DeviceStreamer } from './BiosensorDeviceFactory.js'

export default class BiosensorArrayMonitor implements ArrayMonitor {
    public static Class?: ArrayMonitorConstructor

    protected constructor() {}

    public static Create(devices: DeviceStreamer[]) {
        this.createBridgesFrom(devices)
        return new (this.Class ?? this)()
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

export interface ArrayMonitor {}

export type ArrayMonitorConstructor = new () => ArrayMonitor
