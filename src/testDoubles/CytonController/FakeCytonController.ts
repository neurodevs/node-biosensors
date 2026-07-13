import { CytonController } from '../../impl/openbci/CytonDeviceController.js'

export default class FakeCytonController implements CytonController {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeCytonController.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeCytonController.numCallsToConstructor = 0
    }
}
