import {
    BleDeviceScanner,
    SimpleCharacteristic,
    BleAdapter,
    BleScanner,
} from '@neurodevs/node-ble'
import { MUSE_CHARACTERISTIC_UUIDS } from './museCharacteristicUuids'

export default class MuseStreamGenerator implements StreamGenerator {
    public static Class?: StreamGeneratorConstructor

    private scanner: BleScanner
    private adapter!: BleAdapter

    protected constructor(scanner: BleScanner) {
        this.scanner = scanner
    }

    public static async Create() {
        const scanner = this.BleDeviceScanner()

        const instance = new (this.Class ?? this)(scanner)
        await instance.connect()

        return instance
    }

    public async connect() {
        this.adapter = await this.scanner.scanForName(
            this.museLocalName,
            this.scanOptions
        )
    }

    public async start() {
        await this.writeControlCommands()
    }

    private async writeControlCommands() {
        for (const cmd of ['h', 'p50', 's', 'd']) {
            await this.control.writeAsync(this.encodeCommand(cmd), true)
        }
    }

    private get control() {
        return this.adapter.getCharacteristic(this.controlUuid)!
    }

    private get controlUuid() {
        return MUSE_CHARACTERISTIC_UUIDS.CONTROL
    }

    private encodeCommand(cmd: string) {
        const encoded = new TextEncoder().encode(`X${cmd}\n`)
        encoded[0] = encoded.length - 1
        return Buffer.from(encoded)
    }

    private readonly museLocalName = 'MuseS'

    private readonly eegCharacteristicNames = [
        'EEG_TP9',
        'EEG_AF7',
        'EEG_AF8',
        'EEG_TP10',
        'EEG_AUX',
    ]

    private readonly ppgCharacteristicNames = [
        'PPG_AMBIENT',
        'PPG_INFRARED',
        'PPG_RED',
    ]

    private readonly museCallbacks = this.generateCallbacks()

    private readonly scanOptions = {
        characteristicCallbacks: this.museCallbacks,
    }

    private generateCallbacks() {
        return {
            ...this.generateEegCallbacks(),
            ...this.generatePpgCallbacks(),
        }
    }

    private generateEegCallbacks() {
        return this.eegCharacteristicNames.reduce(
            (acc, name) => ({
                ...acc,
                [MUSE_CHARACTERISTIC_UUIDS[name]]: this.handleEegChannelData,
            }),
            {}
        )
    }

    private handleEegChannelData(
        data: Buffer,
        characteristic: SimpleCharacteristic
    ) {
        console.log(data, characteristic.uuid)
    }

    private generatePpgCallbacks() {
        return this.ppgCharacteristicNames.reduce(
            (acc, name) => ({
                ...acc,
                [MUSE_CHARACTERISTIC_UUIDS[name]]: this.handlePpgChannelData,
            }),
            {}
        )
    }

    private handlePpgChannelData(
        data: Buffer,
        characteristic: SimpleCharacteristic
    ) {
        console.log(data, characteristic.uuid)
    }

    private static BleDeviceScanner() {
        return BleDeviceScanner.Create()
    }
}

export interface StreamGenerator {
    connect(): Promise<void>
    start(): Promise<void>
}

export type StreamGeneratorConstructor = new () => StreamGenerator
