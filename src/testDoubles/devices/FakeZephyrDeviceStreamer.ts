import { DeviceStreamer } from 'types'

export default class FakeZephyrDeviceStreamer implements DeviceStreamer {
    public static numCallsToConstructor = 0
    public static numCallsToConnectBle = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor() {
        FakeZephyrDeviceStreamer.numCallsToConstructor++
    }

    public async connectBle() {
        FakeZephyrDeviceStreamer.numCallsToConnectBle++
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

    public streamQueries = []

    public static resetTestDouble() {
        this.numCallsToConstructor = 0
        this.numCallsToConnectBle = 0
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}

export interface CallToZephyrConstructor {}
