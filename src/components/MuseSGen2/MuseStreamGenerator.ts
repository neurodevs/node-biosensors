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

    private static readonly museCharacteristicNames = [
        'EEG_TP9',
        'EEG_AF7',
        'EEG_AF8',
        'EEG_TP10',
        'EEG_AUX',
    ]

    private static readonly museCallbacks = this.generateCallbacks()

    private static generateCallbacks() {
        return this.museCharacteristicNames.reduce(
            (acc, name) => ({
                ...acc,
                [name]: this.handleEegChannelData.bind(this),
            }),
            {}
        )
    }

    private static handleEegChannelData() {}

    private static readonly scanOptions = {
        characteristicCallbacks: this.museCallbacks,
    }

    private static BleDeviceScanner() {
        return BleDeviceScanner.Create()
    }
}

export interface StreamGenerator {}

export type StreamGeneratorConstructor = new () => StreamGenerator
