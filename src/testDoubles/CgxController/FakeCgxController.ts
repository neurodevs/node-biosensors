import DeviceStateEmitter from '../../impl/DeviceStateEmitter.js'
import { FakeLslOutlet, LslOutlet } from '@neurodevs/node-lsl'

import { DeviceController, DeviceStateListener } from '../../types.js'
import CgxDeviceController, {
    CgxControllerConstructorOptions,
} from '../../impl/cognionics/CgxDeviceController.js'

export default class FakeCgxController implements DeviceController {
    private readonly stateEmitter = new DeviceStateEmitter()

    public static callsToConstructor: (CallToCgxConstructor | undefined)[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor(options?: CgxControllerConstructorOptions) {
        FakeCgxController.callsToConstructor.push(options)
    }

    public async connect() {
        this.stateEmitter.setState('connecting')
        this.stateEmitter.setState('connected')
        FakeCgxController.numCallsToConnect++
    }

    public async startStreaming() {
        this.stateEmitter.setState('streaming')
        FakeCgxController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        this.stateEmitter.setState('connected')
        FakeCgxController.numCallsToStopStreaming++
    }

    public async disconnect() {
        this.stateEmitter.setState('disconnected')
        FakeCgxController.numCallsToDisconnect++
    }

    public fakeEegOutlet = new FakeLslOutlet()
    public fakeAccelOutlet = new FakeLslOutlet()

    public get outlets() {
        return [this.fakeEegOutlet, this.fakeAccelOutlet]
    }

    public streamQueries = CgxDeviceController.streamQueries

    public get state() {
        return this.stateEmitter.state
    }

    public addStateListener(listener: DeviceStateListener) {
        return this.stateEmitter.addStateListener(listener)
    }

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
