import { DeviceStreamer } from 'impl/BiosensorDeviceFactory.js'

export default class FakeZephyrDeviceStreamer implements DeviceStreamer {
    public static numCallsToConstructor = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor() {
        FakeZephyrDeviceStreamer.numCallsToConstructor++
    }

    public async startStreaming() {
        FakeZephyrDeviceStreamer.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeZephyrDeviceStreamer.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeZephyrDeviceStreamer.numCallsToDisconnect++
    }

    public get outlets() {
        return []
    }

    public streamQueries = []

    public static resetTestDouble() {
        this.numCallsToConstructor = 0
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}
