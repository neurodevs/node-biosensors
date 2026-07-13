import {
    ControlBuffer,
    MuseDetector,
} from '../../impl/muse/MuseModelDetector.js'
import { MuseDeviceModel } from '../../impl/muse/MuseDeviceController.js'
import { BleController } from '@neurodevs/node-lsl'

export default class FakeMuseDetector implements MuseDetector {
    public static callsToConstructor: {
        ble: BleController
        controlBuffer: ControlBuffer
    }[] = []
    public static numCallsToDetectModel = 0

    public static fakeResult: MuseDeviceModel = 'Muse S Gen 2'

    public constructor(ble: BleController, controlBuffer: ControlBuffer) {
        FakeMuseDetector.callsToConstructor.push({ ble, controlBuffer })
    }

    public async detectModel() {
        FakeMuseDetector.numCallsToDetectModel++
        return FakeMuseDetector.fakeResult
    }

    public static resetTestDouble() {
        FakeMuseDetector.callsToConstructor.length = 0
        FakeMuseDetector.numCallsToDetectModel = 0
    }
}
