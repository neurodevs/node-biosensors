import { WriteStream } from 'node:fs'

import { BleGatt } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import AbstractDeviceController from './AbstractDeviceController.js'
import { LogLevel } from '../BiosensorDeviceFactory.js'

export default abstract class AbstractDeviceControllerBle extends AbstractDeviceController {
    protected readonly ble: BleGatt

    protected constructor(
        ble: BleGatt,
        recorder?: XdfRecorder,
        txtStream?: WriteStream,
        logLevel?: LogLevel
    ) {
        super(recorder, txtStream, logLevel)

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
