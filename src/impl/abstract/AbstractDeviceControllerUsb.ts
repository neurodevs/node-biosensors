import { UsbDevice } from '@neurodevs/node-lsl'

import { DeviceControllerUsbConstructorOptions } from '../types.js'

import AbstractDeviceController from './AbstractDeviceController.js'

export default abstract class AbstractDeviceControllerUsb extends AbstractDeviceController {
    protected readonly usb: UsbDevice

    protected constructor(options: DeviceControllerUsbConstructorOptions) {
        const { usb, ...rest } = options
        super(rest)

        this.usb = usb
    }

    protected async handleConnect() {
        await this.usb.connect()
    }

    protected async handleDisconnect() {
        await this.usb.disconnect()
    }
}
