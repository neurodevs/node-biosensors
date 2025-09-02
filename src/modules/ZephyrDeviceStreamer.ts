import { DeviceStreamer } from '../types'

export default class ZephyrDeviceStreamer implements DeviceStreamer {
    public static Class?: DeviceStreamerConstructor

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

    public streamQueries: string[] = []
}

export type DeviceStreamerConstructor = new () => DeviceStreamer
