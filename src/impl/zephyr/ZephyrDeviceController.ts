import { BleGatt, BleGattController } from '@neurodevs/node-lsl'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

import {
    DeviceControllerBle,
    DeviceControllerBleConstructor,
    DeviceControllerBleOptions,
} from '../BiosensorDeviceFactory.js'
import AbstractDeviceControllerBle from '../abstract/AbstractDeviceControllerBle.js'

export default class ZephyrDeviceController
    extends AbstractDeviceControllerBle
    implements DeviceControllerBle
{
    public static Class?: DeviceControllerBleConstructor
    public static readonly streamQueries: string[] = []

    protected constructor(ble: BleGatt, recorder?: XdfRecorder) {
        super(ble, recorder)
    }

    public static async Create(options?: DeviceControllerBleOptions) {
        const { xdfRecordPath } = options ?? {}

        const ble = await this.BleGattController(options)

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath)
            : undefined

        return new (this.Class ?? this)(ble, recorder)
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

    public static async XdfStreamRecorder(xdfRecordPath: string) {
        return XdfStreamRecorder.Create(xdfRecordPath, [])
    }
}
