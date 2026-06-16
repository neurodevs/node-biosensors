import {
    DeviceController,
    DeviceControllerBle,
    DeviceControllerBleOptions,
} from '../BiosensorDeviceFactory.js'
import { BleController, BleDeviceController } from '@neurodevs/node-lsl'
import AbstractDeviceControllerBle from '../AbstractDeviceControllerBle.js'

export default class ZephyrDeviceController
    extends AbstractDeviceControllerBle
    implements DeviceControllerBle
{
    public static Class?: ZephyrControllerConstructor
    public static readonly streamQueries: string[] = []

    protected constructor(
        ble: BleController,
        _options?: DeviceControllerBleOptions
    ) {
        super(ble)
    }

    public static async Create(options?: DeviceControllerBleOptions) {
        const ble = await this.BleDeviceController(options)

        return new (this.Class ?? this)(ble, options)
    }

    public get streamQueries() {
        return ZephyrDeviceController.streamQueries
    }

    protected get deviceId() {
        return ''
    }

    protected async handleStartStreaming() {}

    protected async handleStopStreaming() {}

    private static async BleDeviceController(
        options?: DeviceControllerBleOptions
    ) {
        const { bleUuid } = options ?? {}

        return BleDeviceController.Create({
            deviceUuid: bleUuid,
            deviceNamePrefix: 'BH BHT',
            charCallbacks: [],
        })
    }
}

export type ZephyrControllerConstructor = new (
    ble: BleController,
    options?: DeviceControllerBleOptions
) => DeviceController
