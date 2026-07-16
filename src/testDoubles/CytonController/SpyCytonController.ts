import { XdfRecorder } from '@neurodevs/node-xdf'
import CytonDeviceController, {
    OnUsbData,
} from '../../impl/openbci/CytonDeviceController.js'
import { UsbController } from '@neurodevs/node-lsl'

export default class SpyCytonController extends CytonDeviceController {
    public constructor(
        usb: UsbController,
        waitAfterConnectMs: number,
        logDeviceInfo: boolean,
        onData: OnUsbData,
        serialNumber?: string,
        recorder?: XdfRecorder
    ) {
        super(
            usb,
            waitAfterConnectMs,
            logDeviceInfo,
            onData,
            serialNumber,
            recorder
        )
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
