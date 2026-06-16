import { DeviceControllerOptions } from '../../../impl/BiosensorDeviceFactory.js'
import ZephyrDeviceController from '../../../impl/devices/ZephyrDeviceController.js'

export default class SpyZephyrController extends ZephyrDeviceController {
    public constructor(options?: DeviceControllerOptions) {
        super(options)
    }

    public getIsConnected() {
        return this.isConnected
    }

    public getIsStreaming() {
        return this.isStreaming
    }
}
