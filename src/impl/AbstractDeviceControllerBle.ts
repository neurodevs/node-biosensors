import { BleController } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import AbstractDeviceController from './AbstractDeviceController.js'

export default abstract class AbstractDeviceControllerBle extends AbstractDeviceController {
    protected readonly ble: BleController

    protected constructor(ble: BleController, recorder?: XdfRecorder) {
        super(recorder)

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
