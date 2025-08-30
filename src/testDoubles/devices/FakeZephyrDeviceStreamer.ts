import { LslOutlet } from '@neurodevs/node-lsl'
import { DeviceStreamer } from 'types'

export default class FakeZephyrDeviceStreamer implements DeviceStreamer {
    public static callsToConstructor: CallToZephyrConstructor[] = []
    public static numCallsToConnectBle = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor(eegOutlet: LslOutlet, accelOutlet: LslOutlet) {
        FakeZephyrDeviceStreamer.callsToConstructor.push({
            eegOutlet,
            accelOutlet,
        })
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
        this.callsToConstructor = []
        this.numCallsToConnectBle = 0
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}

export interface CallToZephyrConstructor {}
