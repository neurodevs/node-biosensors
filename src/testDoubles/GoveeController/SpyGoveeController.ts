import GoveeDeviceController, {
    GoveeControllerConstructorOptions,
} from '../../impl/govee/GoveeDeviceController.js'

export default class SpyGoveeController extends GoveeDeviceController {
    public constructor(options: GoveeControllerConstructorOptions) {
        super(options)
    }

    public getDeviceId() {
        return this.deviceId
    }

    public getState() {
        return this.state
    }
}
