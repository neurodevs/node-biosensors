import { BleGatt } from '@neurodevs/node-lsl'
import ZephyrDeviceController from '../../impl/zephyr/ZephyrDeviceController.js'
import { XdfRecorder } from '@neurodevs/node-xdf'

export default class SpyZephyrController extends ZephyrDeviceController {
    public constructor(ble: BleGatt, recorder?: XdfRecorder) {
        super(ble, recorder)
    }

    public getDeviceId() {
        return this.deviceId
    }

    public getIsConnected() {
        return this.isConnected
    }

    public getIsStreaming() {
        return this.isStreaming
    }
}
