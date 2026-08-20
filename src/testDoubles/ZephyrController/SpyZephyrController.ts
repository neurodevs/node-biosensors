import { WriteStream } from 'node:fs'

import { LogLevel } from '../../impl/types.js'

import { BleGatt } from '@neurodevs/node-lsl'
import ZephyrDeviceController from '../../impl/zephyr/ZephyrDeviceController.js'
import { XdfRecorder } from '@neurodevs/node-xdf'

export default class SpyZephyrController extends ZephyrDeviceController {
    public constructor(
        ble: BleGatt,
        recorder?: XdfRecorder,
        txtStream?: WriteStream,
        logLevel?: LogLevel
    ) {
        super(ble, recorder, txtStream, logLevel)
    }

    public getDeviceId() {
        return this.deviceId
    }

    public getBle() {
        return this.ble
    }

    public getState() {
        return this.state
    }
}
