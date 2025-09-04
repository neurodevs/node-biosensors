import { LslOutlet } from '@neurodevs/node-lsl'
import { DeviceStreamer } from 'types'
import { CgxDeviceStreamerConstructorOptions } from '../../../modules/devices/CgxDeviceStreamer'

export default class FakeCgxDeviceStreamer implements DeviceStreamer {
    public static callsToConstructor: (CallToCgxConstructor | undefined)[] = []
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor(options?: CgxDeviceStreamerConstructorOptions) {
        FakeCgxDeviceStreamer.callsToConstructor.push(options)
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

    public streamQueries = ['type="EEG"', 'type="ACCEL"']

    public static resetTestDouble() {
        this.callsToConstructor = []
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
