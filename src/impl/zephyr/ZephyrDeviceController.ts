import { BleGattController } from '@neurodevs/node-lsl'

import {
    DeviceControllerBle,
    DeviceControllerBleOptions,
    DeviceControllerBleConstructor,
    DeviceControllerBleConstructorOptions,
} from '../types.js'
import AbstractDeviceControllerBle from '../abstract/AbstractDeviceControllerBle.js'

export default class ZephyrDeviceController
    extends AbstractDeviceControllerBle
    implements DeviceControllerBle
{
    public static Class?: DeviceControllerBleConstructor
    public static readonly streamQueries: string[] = []

    protected constructor(options: DeviceControllerBleConstructorOptions) {
        super(options)
    }

    public static async Create(options?: DeviceControllerBleOptions) {
        const { xdfRecordPath, logLevel } = options ?? {}

        const ble = await this.BleGattController(options)

        const recorder = await this.XdfStreamRecorder(
            xdfRecordPath,
            this.streamQueries
        )

        return new (this.Class ?? this)({ ble, recorder, logLevel })
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
