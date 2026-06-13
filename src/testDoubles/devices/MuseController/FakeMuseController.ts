import { BleController } from '@neurodevs/node-lsl'
import { MuseController } from '../../../impl/devices/MuseDeviceController.js'

export default class FakeMuseController implements MuseController {
    public static callsToConstructor: { ble: BleController }[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public ble: BleController

    public constructor(ble: BleController) {
        FakeMuseController.callsToConstructor.push({ ble })
        this.ble = ble
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

    public static resetTestDouble() {
        FakeMuseController.callsToConstructor = []
        FakeMuseController.numCallsToConnect = 0
        FakeMuseController.numCallsToStartStreaming = 0
        FakeMuseController.numCallsToStopStreaming = 0
        FakeMuseController.numCallsToDisconnect = 0
    }
}
