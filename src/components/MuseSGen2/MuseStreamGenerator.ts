import { BleDeviceScanner } from '@neurodevs/node-ble'

export default class MuseStreamGenerator implements StreamGenerator {
    public static Class?: StreamGeneratorConstructor

    protected constructor() {}

    public static Create() {
        this.BleDeviceScanner()
        return new (this.Class ?? this)()
    }

    private static BleDeviceScanner() {
        return BleDeviceScanner.Create()
    }
}

export interface StreamGenerator {}

export type StreamGeneratorConstructor = new () => StreamGenerator
