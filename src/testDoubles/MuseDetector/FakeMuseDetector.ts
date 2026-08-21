import {
    MuseDetector,
    MuseDetectorConstructorOptions,
} from '../../impl/muse/MuseModelDetector.js'
import { MuseDeviceModel } from '../../impl/muse/MuseDeviceController.js'

export default class FakeMuseDetector implements MuseDetector {
    public static callsToConstructor: MuseDetectorConstructorOptions[] = []
    public static numCallsToDetectModel = 0

    public static fakeResult: MuseDeviceModel = 'Muse S Gen 2'

    public constructor(options: MuseDetectorConstructorOptions) {
        FakeMuseDetector.callsToConstructor.push(options)
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
