import { BleController } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'
import MuseDeviceController, {
    MuseVariant,
} from '../../impl/muse/MuseDeviceController.js'

export default class SpyMuseController extends MuseDeviceController {
    public constructor(
        variant: MuseVariant,
        ble: BleController,
        recorder?: XdfRecorder
    ) {
        super(variant, ble, recorder)
    }

    public getDeviceId() {
        return this.deviceId
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
