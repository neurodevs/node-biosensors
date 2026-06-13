import { BleController } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'
import MuseDeviceController from '../../../impl/devices/MuseDeviceController.js'

export default class SpyMuseController extends MuseDeviceController {
    public constructor(ble: BleController, recorder?: XdfRecorder) {
        super(ble, recorder)
    }

    public getName() {
        return this.ble.name
    }

    public getIsConnected() {
        return this.isConnected
    }

    public getIsStreaming() {
        return this.isStreaming
    }
}
