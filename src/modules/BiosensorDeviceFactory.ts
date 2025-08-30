export default class BiosensorDeviceFactory {
    public static Class?: DeviceFactoryConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface DeviceFactory {}

export type DeviceFactoryConstructor = new () => DeviceFactory
