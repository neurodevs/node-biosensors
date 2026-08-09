import { BleObserverController } from '@neurodevs/node-lsl'
import { DeviceControllerOptions } from '../BiosensorDeviceFactory.js'

export default class GoveeDeviceController implements GoveeController {
    public static Class?: GoveeControllerConstructor

    protected constructor(_options: GoveeControllerOptions) {}

    public static Create(options: GoveeControllerOptions) {
        BleObserverController.Create(options)
        return new (this.Class ?? this)(options)
    }
}

export interface GoveeController {}

export type GoveeControllerConstructor = new (
    options: GoveeControllerOptions
) => GoveeController

export interface GoveeControllerOptions extends DeviceControllerOptions {
    deviceUuid: string
}
