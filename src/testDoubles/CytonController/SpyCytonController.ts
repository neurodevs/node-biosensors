import { XdfRecorder } from '@neurodevs/node-xdf'
import CytonDeviceController, {
    OnUsbData,
} from '../../impl/openbci/CytonDeviceController.js'
import { UsbController } from '@neurodevs/node-lsl'

export default class SpyCytonController extends CytonDeviceController {
    public constructor(
        usb: UsbController,
        onDataHandler: OnUsbData,
        getHasReceivedData: () => boolean,
        serialNumber?: string,
        recorder?: XdfRecorder
    ) {
        super(usb, onDataHandler, getHasReceivedData, serialNumber, recorder)
    }

    public getIsConnected() {
        return this.isConnected
    }

    public getIsStreaming() {
        return this.isStreaming
    }

    public getOnData() {
        return this.onData
    }
}
