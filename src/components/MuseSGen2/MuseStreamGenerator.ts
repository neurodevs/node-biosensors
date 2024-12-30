import { BleDeviceScanner, SimpleCharacteristic } from '@neurodevs/node-ble'

export default class MuseStreamGenerator implements StreamGenerator {
    public static Class?: StreamGeneratorConstructor

    protected constructor() {}

    public static async Create() {
        const scanner = this.BleDeviceScanner()
        await scanner.scanForName(this.museLocalName, this.scanOptions)
        return new (this.Class ?? this)()
    }

    private static readonly museLocalName = 'MuseS'

    private static readonly eegCharacteristicNames = [
        'EEG_TP9',
        'EEG_AF7',
        'EEG_AF8',
        'EEG_TP10',
        'EEG_AUX',
    ]

    private static readonly ppgCharacteristicNames = [
        'PPG_AMBIENT',
        'PPG_INFRARED',
        'PPG_RED',
    ]

    private static readonly museCallbacks = this.generateCallbacks()

    private static readonly scanOptions = {
        characteristicCallbacks: this.museCallbacks,
    }

    private static generateCallbacks() {
        return {
            ...this.generateEegCallbacks(),
            ...this.generatePpgCallbacks(),
        }
    }

    private static generateEegCallbacks() {
        return this.eegCharacteristicNames.reduce(
            (acc, name) => ({
                ...acc,
                [name]: this.handleEegChannelData.bind(this),
            }),
            {}
        )
    }

    private static handleEegChannelData(
        data: Buffer,
        characteristic: SimpleCharacteristic
    ) {
        console.log(data, characteristic)
    }

    private static generatePpgCallbacks() {
        return this.ppgCharacteristicNames.reduce(
            (acc, name) => ({
                ...acc,
                [name]: this.handlePpgChannelData.bind(this),
            }),
            {}
        )
    }

    private static handlePpgChannelData(
        data: Buffer,
        characteristic: SimpleCharacteristic
    ) {
        console.log(data, characteristic)
    }

    private static BleDeviceScanner() {
        return BleDeviceScanner.Create()
    }
}

export interface StreamGenerator {}

export type StreamGeneratorConstructor = new () => StreamGenerator
