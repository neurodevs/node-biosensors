import { DeviceStreamer } from '../types'

export default class DeviceStreamerImpl implements DeviceStreamer {
    public static Class?: DeviceStreamerConstructor

    protected constructor() {}

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

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export type DeviceStreamerConstructor = new () => DeviceStreamer
