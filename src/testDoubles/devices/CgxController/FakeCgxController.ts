import { FakeStreamOutlet, StreamOutlet } from '@neurodevs/node-lsl'

import { DeviceController } from '../../../impl/BiosensorDeviceFactory.js'
import { CgxControllerConstructorOptions } from '../../../impl/devices/CgxDeviceController.js'

export default class FakeCgxController implements DeviceController {
    public static callsToConstructor: (CallToCgxConstructor | undefined)[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor(options?: CgxControllerConstructorOptions) {
        FakeCgxController.callsToConstructor.push(options)
    }

    public async connect() {
        FakeCgxController.numCallsToConnect++
    }

    public async startStreaming() {
        FakeCgxController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeCgxController.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeCgxController.numCallsToDisconnect++
    }

    public fakeEegOutlet = new FakeStreamOutlet()
    public fakeAccelOutlet = new FakeStreamOutlet()

    public get outlets() {
        return [this.fakeEegOutlet, this.fakeAccelOutlet]
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
          eegOutlet?: StreamOutlet
          accelOutlet?: StreamOutlet
      }
    | undefined
