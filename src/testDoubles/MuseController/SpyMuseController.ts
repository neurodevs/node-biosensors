import { WriteStream } from 'node:fs'

import { LogLevel } from '../../impl/types.js'

import { BleGatt } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'
import MuseDeviceController, {
    MuseVariant,
} from '../../impl/muse/MuseDeviceController.js'

export default class SpyMuseController extends MuseDeviceController {
    public constructor(
        variant: MuseVariant,
        ble: BleGatt,
        recorder?: XdfRecorder,
        txtStream?: WriteStream,
        logLevel?: LogLevel
    ) {
        super(variant, ble, recorder, txtStream, logLevel)
    }

    public getDeviceId() {
        return this.deviceId
    }

    public getVariant() {
        return this.variant
    }

    public getName() {
        return this.ble.name
    }

    public getIsConnected() {
        return this.isConnected
    }

    public getIsStreaming() {
        return this.isStreaming
    }
}
