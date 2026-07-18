import { UsbController } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import AbstractDeviceController from './AbstractDeviceController.js'

export default abstract class AbstractDeviceControllerUsb extends AbstractDeviceController {
    protected readonly usb: UsbController

    protected constructor(usb: UsbController, recorder?: XdfRecorder) {
        super(recorder)

        this.usb = usb
    }

    protected async handleConnect() {
        await this.usb.connect()
    }

    protected async handleDisconnect() {
        await this.usb.disconnect()
    }
}
