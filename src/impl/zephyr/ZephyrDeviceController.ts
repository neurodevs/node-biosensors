import { WriteStream } from 'node:fs'

import { BleGatt, BleGattController } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceControllerBle,
    DeviceControllerBleConstructor,
    DeviceControllerBleOptions,
} from '../types.js'
import { LogLevel } from '../types.js'
import AbstractDeviceControllerBle from '../abstract/AbstractDeviceControllerBle.js'

export default class ZephyrDeviceController
    extends AbstractDeviceControllerBle
    implements DeviceControllerBle
{
    public static Class?: DeviceControllerBleConstructor
    public static readonly streamQueries: string[] = []

    protected constructor(
        ble: BleGatt,
        recorder?: XdfRecorder,
        txtStream?: WriteStream,
        logLevel?: LogLevel
    ) {
        super(ble, recorder, txtStream, logLevel)
    }

    public static async Create(options?: DeviceControllerBleOptions) {
        const { xdfRecordPath, logLevel } = options ?? {}

        const ble = await this.BleGattController(options)

        const recorder = await this.XdfStreamRecorder(
            xdfRecordPath,
            this.streamQueries
        )

        return new (this.Class ?? this)(ble, recorder, undefined, logLevel)
    }

    public get streamQueries() {
        return ZephyrDeviceController.streamQueries
    }

    protected get deviceId() {
        return this.bleUuid
    }

    protected async handleStartStreaming() {}

    protected async handleStopStreaming() {}

    private static async BleGattController(
        options?: DeviceControllerBleOptions
    ) {
        const { bleUuid, rssiIntervalMs } = options ?? {}

        return BleGattController.Create({
            deviceUuid: bleUuid,
            deviceNamePrefix: 'BH BHT',
            charCallbacks: [],
            rssiIntervalMs,
        })
    }
}
