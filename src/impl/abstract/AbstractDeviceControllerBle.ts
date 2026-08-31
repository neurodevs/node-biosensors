import { BleGatt } from '@neurodevs/node-lsl'

import AbstractDeviceController from './AbstractDeviceController.js'
import { DeviceControllerBleConstructorOptions } from '../../types.js'

export default abstract class AbstractDeviceControllerBle extends AbstractDeviceController {
    protected readonly ble: BleGatt

    protected constructor(options: DeviceControllerBleConstructorOptions) {
        const { ble, ...rest } = options
        super(rest)

        this.ble = ble
    }

    protected async handleConnect() {
        await this.ble.connect()
    }

    protected async handleDisconnect() {
        await this.ble.disconnect()
    }

    public get bleUuid() {
        return this.ble.uuid
    }

    public get bleName() {
        return this.ble.name
    }
}
