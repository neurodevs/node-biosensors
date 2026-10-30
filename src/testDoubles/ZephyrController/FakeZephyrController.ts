import DeviceStateEmitter from '../../impl/DeviceStateEmitter.js'
import {
    ZephyrController,
    ZephyrControllerConstructorOptions,
} from '../../impl/zephyr/ZephyrDeviceController.js'
import { DeviceStateListener } from '../../types.js'

export default class FakeZephyrDeviceController implements ZephyrController {
    private readonly stateEmitter = new DeviceStateEmitter()

    public static callsToConstructor: ZephyrControllerConstructorOptions[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public readonly deviceName = 'Zephyr BioHarness 3'

    public constructor(options: ZephyrControllerConstructorOptions) {
        FakeZephyrDeviceController.callsToConstructor.push(options)
    }

    public async connect() {
        this.stateEmitter.setState('connecting')
        this.stateEmitter.setState('connected')
        FakeZephyrDeviceController.numCallsToConnect++
    }

    public async startStreaming() {
        this.stateEmitter.setState('streaming')
        FakeZephyrDeviceController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        this.stateEmitter.setState('connected')
        FakeZephyrDeviceController.numCallsToStopStreaming++
    }

    public async disconnect() {
        this.stateEmitter.setState('disconnected')
        FakeZephyrDeviceController.numCallsToDisconnect++
    }

    public get outlets() {
        return []
    }

    public streamQueries = []

    public get identifier() {
        return ''
    }

    public get state() {
        return this.stateEmitter.state
    }

    public addStateListener(listener: DeviceStateListener) {
        return this.stateEmitter.addStateListener(listener)
    }

    public static resetTestDouble() {
        this.callsToConstructor.length = 0
        this.numCallsToConnect = 0
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}
