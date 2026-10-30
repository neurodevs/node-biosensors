import { RfcommDevice } from '@neurodevs/node-lsl'

import { DeviceControllerRfcommConstructorOptions } from '../../types.js'

import AbstractDeviceController from './AbstractDeviceController.js'

export default abstract class AbstractDeviceControllerRfcomm extends AbstractDeviceController {
    protected readonly rfcomm: RfcommDevice

    protected constructor(options: DeviceControllerRfcommConstructorOptions) {
        const { rfcomm, ...rest } = options
        super(rest)

        this.rfcomm = rfcomm
    }

    protected async handleConnect() {
        await this.rfcomm.connect()
    }

    protected async handleDisconnect() {
        await this.rfcomm.disconnect()
    }
}
