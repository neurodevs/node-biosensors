import {
    DeviceController,
    DeviceControllerBleOptions,
} from '../BiosensorDeviceFactory.js'
import { BleController, BleDeviceController } from '@neurodevs/node-lsl'
import AbstractDeviceController from '../AbstractDeviceController.js'

export default class ZephyrDeviceController extends AbstractDeviceController {
    public static Class?: ZephyrControllerConstructor
    public static readonly streamQueries: string[] = []

    protected ble: BleController

    protected constructor(
        ble: BleController,
        _options?: DeviceControllerBleOptions
    ) {
        super()

        this.ble = ble
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

    protected async handleConnect() {
        await this.ble.connect()
    }

    protected async handleDisconnect() {
        await this.ble.disconnect()
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
