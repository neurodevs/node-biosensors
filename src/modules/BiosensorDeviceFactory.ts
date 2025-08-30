export default class BiosensorDeviceFactory {
    public static Class?: DeviceFactoryConstructor

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface DeviceFactory {}

export type DeviceFactoryConstructor = new () => DeviceFactory
