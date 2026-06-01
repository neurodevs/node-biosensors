export default class MuseDeviceController implements DeviceController {
    public static Class?: DeviceControllerConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface DeviceController {}

export type DeviceControllerConstructor = new () => DeviceController
