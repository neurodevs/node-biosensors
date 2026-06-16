import { BleController } from '@neurodevs/node-lsl'
import { DeviceControllerOptions } from '../../../impl/BiosensorDeviceFactory.js'
import ZephyrDeviceController from '../../../impl/devices/ZephyrDeviceController.js'

export default class SpyZephyrController extends ZephyrDeviceController {
    public constructor(ble: BleController, options?: DeviceControllerOptions) {
        super(ble, options)
    }

    public getIsConnected() {
        return this.isConnected
    }

    public getIsStreaming() {
        return this.isStreaming
    }
}
