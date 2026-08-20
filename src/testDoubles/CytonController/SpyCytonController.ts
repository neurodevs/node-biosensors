import CytonDeviceController, {
    CytonControllerConstructorOptions,
} from '../../impl/openbci/CytonDeviceController.js'

export default class SpyCytonController extends CytonDeviceController {
    public constructor(options: CytonControllerConstructorOptions) {
        super(options)
    }

    public getState() {
        return this.state
    }

    public getOnData() {
        return this.onData
    }
}
