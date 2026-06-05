import { BleController } from '@neurodevs/node-lsl'
import MuseDeviceController from '../../impl/MuseDeviceController.js'

export default class SpyMuseController extends MuseDeviceController {
    public constructor(ble: BleController) {
        super(ble)
    }

    public getName() {
        return this.ble.name
    }

    public getIsRunning() {
        return this.isStreaming
    }
}
