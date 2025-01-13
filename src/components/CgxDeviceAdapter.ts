export default class CgxDeviceAdapterImpl implements CgxAdapter {
    public static Class?: CgxAdapterConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface CgxAdapter {}

export type CgxAdapterConstructor = new () => CgxAdapter
