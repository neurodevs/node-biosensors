import { BleController } from '@neurodevs/node-lsl'
import { MuseController } from '../../impl/MuseDeviceController.js'

export default class FakeDeviceController implements MuseController {
    public static callsToConstructor: { ble: BleController }[] = []
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor(ble: BleController) {
        FakeDeviceController.callsToConstructor.push({ ble })
    }

    public async startStreaming() {
        FakeDeviceController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeDeviceController.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeDeviceController.numCallsToDisconnect++
    }

    public static resetTestDouble() {
        FakeDeviceController.callsToConstructor = []
        FakeDeviceController.numCallsToStartStreaming = 0
        FakeDeviceController.numCallsToStopStreaming = 0
        FakeDeviceController.numCallsToDisconnect = 0
    }
}
