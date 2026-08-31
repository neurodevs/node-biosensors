import { BleGatt, FakeLslOutlet } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'
import { DeviceControllerBle } from '../../types.js'
import { MuseControllerConstructorOptions } from '../../impl/muse/MuseDeviceController.js'
import { MuseVariant } from '../../impl/muse/MuseBleVariant.js'

export default class FakeMuseController implements DeviceControllerBle {
    public static callsToConstructor: MuseControllerConstructorOptions[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public variant: MuseVariant
    public ble: BleGatt
    public recorder?: XdfRecorder

    public constructor(options: MuseControllerConstructorOptions) {
        FakeMuseController.callsToConstructor.push(options)

        const { variant, ble, recorder } = options

        this.ble = ble
        this.variant = variant
        this.recorder = recorder
    }

    public async connect() {
        FakeMuseController.numCallsToConnect++
    }

    public async startStreaming() {
        FakeMuseController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeMuseController.numCallsToStopStreaming++
    }

    public async disconnect() {
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

    public static resetTestDouble() {
        FakeMuseController.callsToConstructor = []
        FakeMuseController.numCallsToConnect = 0
        FakeMuseController.numCallsToStartStreaming = 0
        FakeMuseController.numCallsToStopStreaming = 0
        FakeMuseController.numCallsToDisconnect = 0
    }
}
