import { BleController, FakeStreamOutlet } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'
import { DeviceControllerBle } from '../../impl/BiosensorDeviceFactory.js'
import { MuseVariant } from '../../impl/muse/MuseDeviceController.js'

export default class FakeMuseController implements DeviceControllerBle {
    public static callsToConstructor: {
        variant: MuseVariant
        ble: BleController
        recorder?: XdfRecorder
    }[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public variant: MuseVariant
    public ble: BleController
    public recorder?: XdfRecorder

    public constructor(
        variant: MuseVariant,
        ble: BleController,
        recorder?: XdfRecorder
    ) {
        FakeMuseController.callsToConstructor.push({
            ble,
            variant,
            recorder,
        })

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
        return [new FakeStreamOutlet(), new FakeStreamOutlet()]
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
