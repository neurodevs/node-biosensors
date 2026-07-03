import CgxDeviceController, {
    CgxControllerConstructorOptions,
} from '../../impl/cognionics/CgxDeviceController.js'

export default class SpyCgxController extends CgxDeviceController {
    public constructor(options: CgxControllerConstructorOptions) {
        super(options)
    }

    public getNumPacketsDropped() {
        return this.numPacketsDropped
    }
}
