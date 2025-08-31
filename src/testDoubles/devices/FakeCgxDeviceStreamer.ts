import { LslOutlet } from '@neurodevs/node-lsl'
import { DeviceStreamer } from 'types'

export default class FakeCgxDeviceStreamer implements DeviceStreamer {
    public static callsToConstructor: CallToCgxConstructor[] = []
    public static numCallsToConnectBle = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor(eegOutlet?: LslOutlet, accelOutlet?: LslOutlet) {
        FakeCgxDeviceStreamer.callsToConstructor.push({
            eegOutlet,
            accelOutlet,
        })
    }

    public async connectBle() {
        FakeCgxDeviceStreamer.numCallsToConnectBle++
    }

    public async startStreaming() {
        FakeCgxDeviceStreamer.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeCgxDeviceStreamer.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeCgxDeviceStreamer.numCallsToDisconnect++
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

export interface CallToCgxConstructor {
    eegOutlet?: LslOutlet
    accelOutlet?: LslOutlet
}
