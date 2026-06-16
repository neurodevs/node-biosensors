import { BleController, FakeStreamOutlet } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'
import { DeviceControllerBle } from '../../../impl/BiosensorDeviceFactory.js'

export default class FakeMuseController implements DeviceControllerBle {
    public static callsToConstructor: {
        ble: BleController
        recorder?: XdfRecorder
    }[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public ble: BleController
    public recorder?: XdfRecorder

    public constructor(ble: BleController, recorder?: XdfRecorder) {
        FakeMuseController.callsToConstructor.push({ ble, recorder })
        this.ble = ble
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
        return ['type="EEG"', 'type="PPG"']
    }

    public static resetTestDouble() {
        FakeMuseController.callsToConstructor = []
        FakeMuseController.numCallsToConnect = 0
        FakeMuseController.numCallsToStartStreaming = 0
        FakeMuseController.numCallsToStopStreaming = 0
        FakeMuseController.numCallsToDisconnect = 0
    }
}
