import CgxDeviceController, {
    CgxControllerConstructorOptions,
} from '../../../impl/devices/CgxDeviceController.js'

export default class SpyCgxController extends CgxDeviceController {
    public constructor(options: CgxControllerConstructorOptions) {
        super(options)
    }

    public getNumPacketsDropped() {
        return this.numPacketsDropped
    }
}
