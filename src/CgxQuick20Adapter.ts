import { BleScannerImpl } from '@neurodevs/node-ble-scanner'

export default class CgxQuick20Adapter implements BiosensorAdapter {
    public static Class?: BiosensorAdapterConstructor

    protected constructor() {}

    public static Create() {
        BleScannerImpl.Create()
        return new (this.Class ?? this)()
    }
}

export interface BiosensorAdapter {}

export type BiosensorAdapterConstructor = new () => BiosensorAdapter
