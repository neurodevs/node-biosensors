import { GoveeController } from '../../impl/govee/GoveeDeviceController.js'

export default class FakeGoveeController implements GoveeController {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeGoveeController.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeGoveeController.numCallsToConstructor = 0
    }
}
