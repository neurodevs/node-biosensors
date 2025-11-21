import {
    StreamInletOptions,
    StreamOutlet,
    LslStreamInlet,
} from '@neurodevs/node-lsl'

import { DeviceStreamer } from './BiosensorDeviceFactory.js'

export default class BiosensorArrayMonitor implements ArrayMonitor {
    public static Class?: ArrayMonitorConstructor

    protected constructor() {}

    public static Create(devices: DeviceStreamer[]) {
        this.createStreamInlets(devices)

        return new (this.Class ?? this)()
    }

    private static createStreamInlets(devices: DeviceStreamer[]) {
        devices.flatMap((device) => {
            return this.createInletsFrom(device)
        })
    }

    private static createInletsFrom(device: DeviceStreamer) {
        return device.outlets.map((outlet) => {
            return this.createInletFrom(outlet)
        })
    }

    private static createInletFrom(outlet: StreamOutlet) {
        return this.LslStreamInlet({
            sampleRateHz: outlet.sampleRateHz,
            channelNames: outlet.channelNames,
            channelFormat: outlet.channelFormat,
            chunkSize: outlet.chunkSize,
            maxBufferedMs: outlet.maxBufferedMs,
        })
    }

    private static LslStreamInlet(options: StreamInletOptions) {
        return LslStreamInlet.Create(options, () => {})
    }
}

export interface ArrayMonitor {}

export type ArrayMonitorConstructor = new () => ArrayMonitor
