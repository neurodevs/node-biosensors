import { BleController } from '@neurodevs/node-lsl'
import ZephyrDeviceController from '../../../impl/devices/ZephyrDeviceController.js'
import { XdfRecorder } from '@neurodevs/node-xdf'

export default class SpyZephyrController extends ZephyrDeviceController {
    public constructor(ble: BleController, recorder?: XdfRecorder) {
        super(ble, recorder)
    }

    public getIsConnected() {
        return this.isConnected
    }

    public getIsStreaming() {
        return this.isStreaming
    }
}
