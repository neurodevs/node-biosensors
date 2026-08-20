import { FakeLslOutlet, LslOutlet } from '@neurodevs/node-lsl'

import { DeviceController } from '../../impl/types.js'
import CgxDeviceController, {
    CgxControllerConstructorOptions,
} from '../../impl/cognionics/CgxDeviceController.js'

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

    public fakeEegOutlet = new FakeLslOutlet()
    public fakeAccelOutlet = new FakeLslOutlet()

    public get outlets() {
        return [this.fakeEegOutlet, this.fakeAccelOutlet]
    }

    public streamQueries = CgxDeviceController.streamQueries

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
