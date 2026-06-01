import { MuseController } from '../../impl/MuseDeviceController.js'

export default class FakeDeviceController implements MuseController {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeDeviceController.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeDeviceController.numCallsToConstructor = 0
    }
}
