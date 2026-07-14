import { XdfRecorder } from '@neurodevs/node-xdf'
import CytonDeviceController from '../../impl/openbci/CytonDeviceController.js'
import { UsbController } from '@neurodevs/node-lsl'

export default class SpyCytonController extends CytonDeviceController {
    public constructor(
        usb: UsbController,
        serialNumber?: string,
        recorder?: XdfRecorder
    ) {
        super(usb, serialNumber, recorder)
    }

    public getIsConnected() {
        return this.isConnected
    }

    public getIsStreaming() {
        return this.isStreaming
    }

    public getOnData() {
        return CytonDeviceController.onData
    }
}
