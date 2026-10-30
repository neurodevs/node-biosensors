import ZephyrDeviceController, {
    ZephyrControllerConstructorOptions,
} from '../../impl/zephyr/ZephyrDeviceController.js'

export default class SpyZephyrController extends ZephyrDeviceController {
    public constructor(options: ZephyrControllerConstructorOptions) {
        super(options)
    }

    public getDeviceId() {
        return this.deviceId
    }

    public getOnData() {
        return this.onData
    }

    public getState() {
        return this.state
    }
}
