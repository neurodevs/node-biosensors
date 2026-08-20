import { UsbDevice } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import { LogLevel } from '../types.js'

import AbstractDeviceController from './AbstractDeviceController.js'

export default abstract class AbstractDeviceControllerUsb extends AbstractDeviceController {
    protected readonly usb: UsbDevice

    protected constructor(
        usb: UsbDevice,
        recorder?: XdfRecorder,
        logLevel?: LogLevel
    ) {
        super(recorder, undefined, logLevel)

        this.usb = usb
    }

    protected async handleConnect() {
        await this.usb.connect()
    }

    protected async handleDisconnect() {
        await this.usb.disconnect()
    }
}
