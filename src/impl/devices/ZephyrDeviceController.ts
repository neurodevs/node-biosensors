import {
    DeviceControllerConstructor,
    DeviceControllerOptions,
} from '../BiosensorDeviceFactory.js'
import { BleDeviceController } from '@neurodevs/node-lsl'
import AbstractDeviceController from './AbstractDeviceController.js'

export default class ZephyrDeviceController extends AbstractDeviceController {
    public static Class?: DeviceControllerConstructor
    public static readonly streamQueries: string[] = []

    protected constructor(_options?: DeviceControllerOptions) {
        super()
    }

    public static async Create(options?: DeviceControllerOptions) {
        await this.BleDeviceController()
        return new (this.Class ?? this)(options)
    }

    public get streamQueries() {
        return ZephyrDeviceController.streamQueries
    }

    protected get deviceId() {
        return ''
    }

    protected async handleConnect() {}

    protected async handleDisconnect() {}

    protected async handleStartStreaming() {}

    protected async handleStopStreaming() {}

    private static async BleDeviceController() {
        await BleDeviceController.Create({
            charCallbacks: [],
            deviceNamePrefix: 'BH BHT',
            deviceUuid: undefined,
        })
    }
}
