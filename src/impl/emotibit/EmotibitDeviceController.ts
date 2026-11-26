import { DeviceControllerOptions } from '../../types.js'

export default class EmotibitDeviceController implements EmotibitController {
    public static Class?: EmotibitControllerConstructor

    protected constructor(_options?: EmotibitControllerOptions) {}

    public static Create(options?: EmotibitControllerOptions) {
        return new (this.Class ?? this)(options)
    }
}

export interface EmotibitController {}

export type EmotibitControllerOptions = DeviceControllerOptions

export type EmotibitControllerConstructor = new (
    options?: EmotibitControllerOptions
) => EmotibitController
