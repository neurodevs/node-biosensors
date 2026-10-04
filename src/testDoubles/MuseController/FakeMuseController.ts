import DeviceStateEmitter from '../../impl/DeviceStateEmitter.js'
import { BleGatt, FakeLslOutlet } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'
import { DeviceControllerBle, DeviceStateListener } from '../../types.js'
import {
    MuseControllerConstructorOptions,
    MuseDeviceModel,
} from '../../impl/muse/MuseDeviceController.js'
import { MuseVariant } from '../../impl/muse/MuseBleVariant.js'

export default class FakeMuseController implements DeviceControllerBle {
    private readonly stateEmitter = new DeviceStateEmitter()

    public static callsToConstructor: MuseControllerConstructorOptions[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public deviceName: MuseDeviceModel
    public variant: MuseVariant
    public ble: BleGatt
    public recorder?: XdfRecorder

    public constructor(options: MuseControllerConstructorOptions) {
        FakeMuseController.callsToConstructor.push(options)

        const { deviceName, variant, ble, recorder } = options

        this.deviceName = deviceName

        this.ble = ble
        this.variant = variant
        this.recorder = recorder
    }

    public async connect() {
        this.stateEmitter.setState('connecting')
        this.stateEmitter.setState('connected')
        FakeMuseController.numCallsToConnect++
    }

    public async startStreaming() {
        this.stateEmitter.setState('streaming')
        FakeMuseController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        this.stateEmitter.setState('connected')
        FakeMuseController.numCallsToStopStreaming++
    }

    public async disconnect() {
        this.stateEmitter.setState('disconnected')
        FakeMuseController.numCallsToDisconnect++
    }

    public get bleUuid() {
        return this.ble.uuid
    }

    public get bleName() {
        return this.ble.name
    }

    public get outlets() {
        return [new FakeLslOutlet(), new FakeLslOutlet()]
    }

    public get streamQueries() {
        return ['type="EEG"', 'type="PPG"', 'type="GYRO"', 'type="ACCEL"']
    }

    public get state() {
        return this.stateEmitter.state
    }

    public addStateListener(listener: DeviceStateListener) {
        return this.stateEmitter.addStateListener(listener)
    }

    public static resetTestDouble() {
        FakeMuseController.callsToConstructor = []
        FakeMuseController.numCallsToConnect = 0
        FakeMuseController.numCallsToStartStreaming = 0
        FakeMuseController.numCallsToStopStreaming = 0
        FakeMuseController.numCallsToDisconnect = 0
    }
}
