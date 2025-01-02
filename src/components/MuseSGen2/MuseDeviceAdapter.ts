export default class MuseDeviceAdapter implements MuseAdapter {
    public static Class?: MuseAdapterConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface MuseAdapter {}

export type MuseAdapterConstructor = new () => MuseAdapter
