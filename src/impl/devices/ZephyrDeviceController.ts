import {
    DeviceController,
    DeviceControllerOptions,
} from '../BiosensorDeviceFactory.js'
import { BleController, BleDeviceController } from '@neurodevs/node-lsl'
import AbstractDeviceController from '../AbstractDeviceController.js'

export type ZephyrControllerConstructor = new (
    ble: BleController,
    options?: DeviceControllerOptions
) => DeviceController

export default class ZephyrDeviceController extends AbstractDeviceController {
    public static Class?: ZephyrControllerConstructor
    public static readonly streamQueries: string[] = []

    protected ble: BleController

    protected constructor(
        ble: BleController,
        _options?: DeviceControllerOptions
    ) {
        super()

        this.ble = ble
    }

    public static async Create(options?: DeviceControllerOptions) {
        const ble = await this.BleDeviceController()

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

    private static async BleDeviceController() {
        return BleDeviceController.Create({
            charCallbacks: [],
            deviceNamePrefix: 'BH BHT',
            deviceUuid: undefined,
        })
    }
}
