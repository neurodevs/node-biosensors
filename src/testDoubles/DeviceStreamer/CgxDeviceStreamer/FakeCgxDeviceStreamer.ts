import { LslOutlet } from '@neurodevs/node-lsl'
import { DeviceStreamer } from 'types'
import { CgxDeviceStreamerConstructorOptions } from '../../../modules/devices/CgxDeviceStreamer'

export default class FakeCgxDeviceStreamer implements DeviceStreamer {
    public static callsToConstructor: (CallToCgxConstructor | undefined)[] = []
    public static numCallsToConnectBle = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor(options?: CgxDeviceStreamerConstructorOptions) {
        FakeCgxDeviceStreamer.callsToConstructor.push(options)
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

export type CallToCgxConstructor =
    | {
          eegOutlet?: LslOutlet
          accelOutlet?: LslOutlet
      }
    | undefined
