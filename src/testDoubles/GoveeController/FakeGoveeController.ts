import {
    GoveeController,
    GoveeControllerOptions,
} from '../../impl/govee/GoveeDeviceController.js'

export default class FakeGoveeController implements GoveeController {
    public static callsToConstructor: GoveeControllerOptions[] = []

    public constructor(options: GoveeControllerOptions) {
        FakeGoveeController.callsToConstructor.push(options)
    }

    public static resetTestDouble() {
        FakeGoveeController.callsToConstructor = []
    }
}
