import { DeviceStreamer } from 'impl/BiosensorDeviceFactory'

export default class ZephyrDeviceStreamer implements DeviceStreamer {
    public static Class?: DeviceStreamerConstructor
    public static readonly streamQueries = []

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public async startStreaming() {
        throw new Error('Method not implemented.')
    }

    public async stopStreaming() {
        throw new Error('Method not implemented.')
    }

    public async disconnect() {
        throw new Error('Method not implemented.')
    }

    public get outlets() {
        return []
    }

    public streamQueries = ZephyrDeviceStreamer.streamQueries
}

export type DeviceStreamerConstructor = new () => DeviceStreamer
