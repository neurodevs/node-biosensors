import { DeviceControllerBleConstructorOptions } from '../../impl/types.js'
import ZephyrDeviceController from '../../impl/zephyr/ZephyrDeviceController.js'

export default class SpyZephyrController extends ZephyrDeviceController {
    public constructor(options: DeviceControllerBleConstructorOptions) {
        super(options)
    }

    public getDeviceId() {
        return this.deviceId
    }

    public getBle() {
        return this.ble
    }

    public getState() {
        return this.state
    }
}
