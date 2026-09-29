import DeviceStateEmitter from '../../impl/DeviceStateEmitter.js'
import { FakeLslOutlet } from '@neurodevs/node-lsl'

import { DeviceControllerBle, DeviceStateListener } from '../../types.js'
import { GoveeControllerConstructorOptions } from '../../impl/govee/GoveeDeviceController.js'

export default class FakeGoveeController implements DeviceControllerBle {
    private readonly stateEmitter = new DeviceStateEmitter()

    public static callsToConstructor: GoveeControllerConstructorOptions[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    private readonly deviceUuid: string

    public constructor(options: GoveeControllerConstructorOptions) {
        const { deviceUuid } = options

        this.deviceUuid = deviceUuid

        FakeGoveeController.callsToConstructor.push(options)
    }

    public async connect() {
        this.stateEmitter.setState('connecting')
        this.stateEmitter.setState('connected')
        FakeGoveeController.numCallsToConnect++
    }

    public async startStreaming() {
        this.stateEmitter.setState('streaming')
        FakeGoveeController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        this.stateEmitter.setState('connected')
        FakeGoveeController.numCallsToStopStreaming++
    }

    public async disconnect() {
        this.stateEmitter.setState('disconnected')
        FakeGoveeController.numCallsToDisconnect++
    }

    public fakeTemperatureOutlet = new FakeLslOutlet()
    public fakeHumidityOutlet = new FakeLslOutlet()
    public fakeBatteryOutlet = new FakeLslOutlet()

    public get outlets() {
        return [
            this.fakeTemperatureOutlet,
            this.fakeHumidityOutlet,
            this.fakeBatteryOutlet,
        ]
    }

    public streamQueries = []

    public get bleUuid() {
        return this.deviceUuid
    }

    public get bleName() {
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
