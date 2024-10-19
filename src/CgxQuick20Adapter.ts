export default class CgxQuick20Adapter implements BiosensorAdapter {
    public static Class?: BiosensorAdapterConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface BiosensorAdapter {}

export type BiosensorAdapterConstructor = new () => BiosensorAdapter
