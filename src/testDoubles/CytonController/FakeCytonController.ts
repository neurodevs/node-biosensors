import { LslOutlet } from '@neurodevs/node-lsl'
import DeviceStateEmitter from '../../impl/DeviceStateEmitter.js'
import { DeviceStateListener } from '../../types.js'
import {
    CytonController,
    CytonControllerConstructorOptions,
} from '../../impl/openbci/CytonDeviceController.js'

export default class FakeCytonController implements CytonController {
    private readonly stateEmitter = new DeviceStateEmitter()

    public static callsToConstructor: CytonControllerConstructorOptions[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconenct = 0

    public static fakeOutlets: LslOutlet[] = []
    public static fakeStreamQueries: string[] = []

    public constructor(options: CytonControllerConstructorOptions) {
        FakeCytonController.callsToConstructor.push(options)
    }

    public async connect() {
        this.stateEmitter.setState('connecting')
        this.stateEmitter.setState('connected')
        FakeCytonController.numCallsToConnect++
    }

    public async startStreaming() {
        this.stateEmitter.setState('streaming')
        FakeCytonController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        this.stateEmitter.setState('connected')
        FakeCytonController.numCallsToStopStreaming++
    }

    public async disconnect() {
        this.stateEmitter.setState('disconnected')
        FakeCytonController.numCallsToDisconenct++
    }

    public get outlets() {
        return FakeCytonController.fakeOutlets
    }

    public get streamQueries() {
        return FakeCytonController.fakeStreamQueries
    }

    public get state() {
        return this.stateEmitter.state
    }

    public addStateListener(listener: DeviceStateListener) {
        return this.stateEmitter.addStateListener(listener)
    }

    public static resetTestDouble() {
        FakeCytonController.callsToConstructor = []
        FakeCytonController.numCallsToConnect = 0
        FakeCytonController.numCallsToStartStreaming = 0
        FakeCytonController.numCallsToStopStreaming = 0
        FakeCytonController.numCallsToDisconenct = 0
    }
}
