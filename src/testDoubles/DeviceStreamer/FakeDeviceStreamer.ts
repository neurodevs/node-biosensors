import { FakeLslOutlet } from '@neurodevs/node-lsl'
import { DeviceStreamer, DeviceStreamerOptions } from 'types'

export default class FakeDeviceStreamer implements DeviceStreamer {
    public static callsToConstructor: (DeviceStreamerOptions | undefined)[] = []
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public static fakeStreamQueries: string[] = []

    public constructor(options?: DeviceStreamerOptions) {
        FakeDeviceStreamer.callsToConstructor.push(options)
    }

    public async startStreaming() {
        FakeDeviceStreamer.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeDeviceStreamer.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeDeviceStreamer.numCallsToDisconnect++
    }

    public get outlets() {
        return this.streamQueries.map(() => new FakeLslOutlet())
    }

    public streamQueries = FakeDeviceStreamer.fakeStreamQueries

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}
