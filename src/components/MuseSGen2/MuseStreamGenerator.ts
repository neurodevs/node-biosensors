import {
    BleDeviceScanner,
    SimpleCharacteristic,
    BleAdapter,
    BleScanner,
    ScanOptions,
    Characteristic,
} from '@neurodevs/node-ble'
import {
    ChannelFormat,
    LslOutlet,
    LslOutletOptions,
    LslStreamOutlet,
} from '@neurodevs/node-lsl'
import { MUSE_CHARACTERISTIC_UUIDS } from './museCharacteristicUuids'

export default class MuseStreamGenerator implements StreamGenerator {
    public static Class?: StreamGeneratorConstructor

    private scanner: BleScanner
    private scanOptions!: ScanOptions
    private adapter!: BleAdapter
    private eegOutlet: LslOutlet
    private eegChannelChunks = this.generateEmptyEegMatrix()

    protected constructor(options: StreamGeneratorConstructorOptions) {
        const { scanner, eegOutlet } = options

        this.scanner = scanner
        this.eegOutlet = eegOutlet

        this.generateScanOptions()
    }

    public static async Create() {
        const scanner = this.BleDeviceScanner()

        const eegOutlet = await this.LslStreamOutlet(this.eegOutletOptions)
        await this.LslStreamOutlet(this.ppgOutletOptions)

        const instance = new (this.Class ?? this)({ scanner, eegOutlet })
        await instance.connect()

        return instance
    }

    private generateScanOptions() {
        this.scanOptions = {
            characteristicCallbacks: this.generateCharCallbacks(),
        }
    }

    private generateCharCallbacks() {
        return {
            ...this.generateEegCallbacks(),
            ...this.generatePpgCallbacks(),
        }
    }

    private generateEegCallbacks() {
        return this.eegCharacteristicNames.reduce(
            (acc, name) => ({
                ...acc,
                [MUSE_CHARACTERISTIC_UUIDS[name]]:
                    this.handleEegChannelForChunk.bind(this),
            }),
            {}
        )
    }

    protected handleEegChannelForChunk(data: Buffer, char: Characteristic) {
        const channelValuesForChunk = Array.from(data) as number[]
        const channelCharIdx = this.getEegCharIdx(char.uuid)

        this.eegChannelChunks[channelCharIdx] = channelValuesForChunk

        if (this.isLastChannel(channelCharIdx)) {
            this.pushEegSamples()
        }
    }

    private getEegCharIdx(charUuid: string) {
        return this.eegCharacteristicUuids.indexOf(charUuid)
    }

    private isLastChannel(charIdx: number) {
        return charIdx === 4
    }

    private pushEegSamples() {
        for (let j = 0; j < this.eegChunkSize; j++) {
            const chunkIdx = j
            this.createAndPushSample(chunkIdx)
        }
        this.resetEegChannelChunks()
    }

    private createAndPushSample(chunkIdx: number) {
        let sample: number[] = []

        for (let i = 0; i < this.eegNumChannels; i++) {
            const channelIdx = i
            const channelValue = this.eegChannelChunks[channelIdx][chunkIdx]

            sample.push(channelValue)
        }

        this.eegOutlet.pushSample(sample)
    }

    protected resetEegChannelChunks() {
        this.eegChannelChunks = this.generateEmptyEegMatrix()
    }

    private generateEmptyEegMatrix() {
        return this.generateEmptyMatrix(this.eegNumChannels, this.eegChunkSize)
    }

    private generateEmptyMatrix(rows: number, columns: number) {
        return Array.from({ length: rows }, () => new Array(columns).fill(0))
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

    private get eegChunkSize() {
        return MuseStreamGenerator.eegChunkSize
    }

    private readonly museLocalName = 'MuseS'

    private readonly eegCharacteristicNames = [
        'EEG_TP9',
        'EEG_AF7',
        'EEG_AF8',
        'EEG_TP10',
        'EEG_AUX',
    ]

    private readonly eegNumChannels = this.eegCharacteristicNames.length

    private readonly eegCharacteristicUuids = this.eegCharacteristicNames.map(
        (name) => MUSE_CHARACTERISTIC_UUIDS[name]
    )

    private readonly ppgCharacteristicNames = [
        'PPG_AMBIENT',
        'PPG_INFRARED',
        'PPG_RED',
    ]

    private static readonly eegSampleRate = 256
    private static readonly eegChunkSize = 12

    private static readonly eegChannelNames = [
        'TP9',
        'AF7',
        'AF8',
        'TP10',
        'AUX',
    ]

    private static readonly eegOutletOptions = {
        name: 'Muse S Gen 2 EEG',
        type: 'EEG',
        channelNames: this.eegChannelNames,
        sampleRate: this.eegSampleRate,
        channelFormat: 'float32' as ChannelFormat,
        sourceId: 'muse-eeg',
        manufacturer: 'Interaxon Inc.',
        unit: 'microvolt',
        chunkSize: this.eegChunkSize,
        maxBuffered: 360,
    }

    private static readonly ppgOutletOptions = {
        name: 'Muse S Gen 2 PPG',
        type: 'PPG',
        channelNames: ['Ambient', 'Infrared', 'Red'],
        sampleRate: 64,
        channelFormat: 'float32' as ChannelFormat,
        sourceId: 'muse-s-ppg',
        manufacturer: 'Interaxon Inc.',
        unit: 'N/A',
        chunkSize: 6,
        maxBuffered: 360,
    }

    private static async LslStreamOutlet(options: LslOutletOptions) {
        return await LslStreamOutlet.Create(options)
    }

    private static BleDeviceScanner() {
        return BleDeviceScanner.Create()
    }
}

export interface StreamGenerator {
    connect(): Promise<void>
    start(): Promise<void>
}

export type StreamGeneratorConstructor = new (
    options: StreamGeneratorConstructorOptions
) => StreamGenerator

export interface StreamGeneratorConstructorOptions {
    scanner: BleScanner
    eegOutlet: LslOutlet
}
