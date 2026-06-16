import {
    DeviceController,
    DeviceControllerConstructor,
    DeviceControllerOptions,
} from '../BiosensorDeviceFactory.js'
import { BleDeviceController } from '@neurodevs/node-lsl'

export default class ZephyrDeviceController implements DeviceController {
    public static Class?: DeviceControllerConstructor
    public static readonly streamQueries = []

    protected constructor(_options?: DeviceControllerOptions) {}

    public static async Create(options?: DeviceControllerOptions) {
        await this.BleDeviceController()
        return new (this.Class ?? this)(options)
    }

    public async startStreaming() {
        throw new Error('Method not implemented.')
    }

    public async stopStreaming() {
        throw new Error('Method not implemented.')
    }

    public async disconnect() {
        throw new Error('Method not implemented.')
    }

    public get outlets() {
        return []
    }

    public streamQueries = ZephyrDeviceController.streamQueries

    private static async BleDeviceController() {
        await BleDeviceController.Create({
            charCallbacks: [],
            deviceNamePrefix: 'BH BHT',
            deviceUuid: undefined,
        })
    }
}
