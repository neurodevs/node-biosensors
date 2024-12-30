import { BleDeviceScanner } from '@neurodevs/node-ble'

export default class MuseStreamGenerator implements StreamGenerator {
    public static Class?: StreamGeneratorConstructor

    protected constructor() {}

    public static async Create() {
        const scanner = this.BleDeviceScanner()
        await scanner.scanForName(this.museLocalName, this.scanOptions)
        return new (this.Class ?? this)()
    }

    private static readonly museLocalName = 'MuseS'

    private static readonly museCharacteristicCallbacks = {}

    private static readonly scanOptions = {
        characteristicCallbacks: this.museCharacteristicCallbacks,
    }

    private static BleDeviceScanner() {
        return BleDeviceScanner.Create()
    }
}

export interface StreamGenerator {}

export type StreamGeneratorConstructor = new () => StreamGenerator
