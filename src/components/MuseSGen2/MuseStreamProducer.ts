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

export default class MuseStreamProducer implements MuseProducer {
    public static Class?: MuseProducerConstructor

    private scanner: BleScanner
    private scanOptions!: ScanOptions
    private ble!: BleAdapter
    private eegOutlet: LslOutlet
    private ppgOutlet: LslOutlet
    private eegChannelChunks = this.generateEmptyEegMatrix()
    private ppgChannelChunks = this.generateEmptyPpgMatrix()
    private encoder: TextEncoder

    protected constructor(options: MuseProducerConstructorOptions) {
        const { scanner, eegOutlet, ppgOutlet } = options

        this.scanner = scanner
        this.eegOutlet = eegOutlet
        this.ppgOutlet = ppgOutlet
        this.encoder = this.TextEncoder()

        this.generateScanOptions()
    }

    public static async Create(options?: MuseProducerOptions) {
        const { connectBleOnCreate = true } = options ?? {}
        const scanner = this.BleDeviceScanner()

        const eegOutlet = await this.LslStreamOutlet(this.eegOutletOptions)
        const ppgOutlet = await this.LslStreamOutlet(this.ppgOutletOptions)

        const instance = new (this.Class ?? this)({
            scanner,
            eegOutlet,
            ppgOutlet,
        })

        if (connectBleOnCreate) {
            await instance.connectBle()
        }

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
        return this.eegCharNames.reduce(
            (acc, name) => ({
                ...acc,
                [CHAR_UUIDS[name]]: this.handleEegChannelChunk.bind(this),
            }),
            {}
        )
    }

    protected handleEegChannelChunk(data: Buffer, char: Characteristic) {
        const channelValuesForChunk = Array.from(data).slice(2) as number[]
        const channelIdx = this.getEegChannelIdx(char.uuid)

        this.eegChannelChunks[channelIdx] = channelValuesForChunk

        if (this.isLastEegChannel(channelIdx)) {
            this.pushEegSamples()
        }
    }

    private getEegChannelIdx(charUuid: string) {
        return this.eegCharUuids.indexOf(charUuid)
    }

    private isLastEegChannel(charIdx: number) {
        return charIdx === 4
    }

    private pushEegSamples() {
        for (let j = 0; j < this.eegChunkSize; j++) {
            const chunkIdx = j
            this.createAndPushEegSample(chunkIdx)
        }
        this.resetEegChannelChunks()
    }

    private createAndPushEegSample(chunkIdx: number) {
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

    private generatePpgCallbacks() {
        return this.ppgCharNames.reduce(
            (acc, name) => ({
                ...acc,
                [CHAR_UUIDS[name]]: this.handlePpgChannelChunk.bind(this),
            }),
            {}
        )
    }

    protected handlePpgChannelChunk(data: Buffer, char: SimpleCharacteristic) {
        const channelValuesForChunk = Array.from(data)
        const channelIdx = this.getPpgChannelIdx(char.uuid)

        this.ppgChannelChunks[channelIdx] = channelValuesForChunk

        if (this.isLastPpgChannel(channelIdx)) {
            this.pushPpgSamples()
        }
    }

    private getPpgChannelIdx(charUuid: string) {
        return this.ppgCharUuids.indexOf(charUuid)
    }

    private isLastPpgChannel(idx: number) {
        return idx === 2
    }

    private pushPpgSamples() {
        for (let j = 0; j < this.ppgChunkSize; j++) {
            const chunkIdx = j
            this.createAndPushPpgSample(chunkIdx)
        }
        this.resetPpgChannelChunks()
    }

    private createAndPushPpgSample(chunkIdx: number) {
        let sample: number[] = []

        for (let i = 0; i < this.ppgNumChannels; i++) {
            const channelIdx = i
            const channelValue = this.ppgChannelChunks[channelIdx][chunkIdx]

            sample.push(channelValue)
        }

        this.ppgOutlet.pushSample(sample)
    }

    protected resetPpgChannelChunks() {
        this.ppgChannelChunks = this.generateEmptyPpgMatrix()
    }

    public async connectBle() {
        this.ble = await this.scanner.scanForName(
            this.bleLocalName,
            this.scanOptions
        )
    }

    public async startLslStreams() {
        await this.writeControlCommands()
    }

    private async writeControlCommands() {
        for (const cmd of ['h', 'p50', 's', 'd']) {
            const buffer = this.createBufferFrom(cmd)
            await this.control.writeAsync(buffer, true)
        }
    }

    private get control() {
        return this.ble.getCharacteristic(this.controlUuid)!
    }

    private get controlUuid() {
        return CHAR_UUIDS.CONTROL
    }

    private createBufferFrom(cmd: string) {
        const encoded = this.encoder.encode(`X${cmd}\n`)
        encoded[0] = encoded.length - 1
        return Buffer.from(encoded)
    }

    private generateEmptyEegMatrix() {
        return this.generateEmptyMatrix(this.eegNumChannels, this.eegChunkSize)
    }

    private generateEmptyPpgMatrix() {
        return this.generateEmptyMatrix(this.ppgNumChannels, this.ppgChunkSize)
    }

    private generateEmptyMatrix(rows: number, columns: number) {
        return Array.from({ length: rows }, () => new Array(columns).fill(0))
    }

    private readonly bleLocalName = 'MuseS'

    private readonly eegCharNames = MuseStreamProducer.eegCharacteristicNames
    private readonly eegChunkSize = MuseStreamProducer.eegChunkSize
    private readonly eegNumChannels = this.eegCharNames.length

    private readonly ppgCharNames = MuseStreamProducer.ppgCharacteristicNames
    private readonly ppgChunkSize = MuseStreamProducer.ppgChunkSize
    private readonly ppgNumChannels = this.ppgCharNames.length

    private readonly eegCharUuids = this.eegCharNames.map(
        (name) => CHAR_UUIDS[name]
    )

    private readonly ppgCharUuids = this.ppgCharNames.map(
        (name) => CHAR_UUIDS[name]
    )

    private static readonly eegChunkSize = 12
    private static readonly eegSampleRate = 256
    private static readonly ppgChunkSize = 6
    private static readonly ppgSampleRate = 64

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

    private static readonly eegOutletOptions = {
        name: 'Muse S Gen 2 EEG',
        type: 'EEG',
        channelNames: this.eegCharacteristicNames,
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
        channelNames: this.ppgCharacteristicNames,
        sampleRate: this.ppgSampleRate,
        channelFormat: 'float32' as ChannelFormat,
        sourceId: 'muse-s-ppg',
        manufacturer: 'Interaxon Inc.',
        unit: 'N/A',
        chunkSize: this.ppgChunkSize,
        maxBuffered: 360,
    }

    private TextEncoder() {
        return new TextEncoder()
    }

    private static async LslStreamOutlet(options: LslOutletOptions) {
        return await LslStreamOutlet.Create(options)
    }

    private static BleDeviceScanner() {
        return BleDeviceScanner.Create()
    }
}

export interface MuseProducer {
    connectBle(): Promise<void>
    startLslStreams(): Promise<void>
}

export interface MuseProducerOptions {
    connectBleOnCreate: boolean
}

export type MuseProducerConstructor = new (
    options: MuseProducerConstructorOptions
) => MuseProducer

export interface MuseProducerConstructorOptions {
    scanner: BleScanner
    eegOutlet: LslOutlet
    ppgOutlet: LslOutlet
}

export const MUSE_CHARACTERISTIC_UUIDS: Record<string, string> = {
    CONTROL: '273e00014c4d454d96bef03bac821358',
    TELEMETRY: '273e000b4c4d454d96bef03bac821358',
    GYROSCOPE: '273e00094c4d454d96bef03bac821358',
    ACCELEROMETER: '273e000a4c4d454d96bef03bac821358',
    PPG_AMBIENT: '273e000f4c4d454d96bef03bac821358',
    PPG_INFRARED: '273e00104c4d454d96bef03bac821358',
    PPG_RED: '273e00114c4d454d96bef03bac821358',
    EEG_TP9: '273e00034c4d454d96bef03bac821358',
    EEG_AF7: '273e00044c4d454d96bef03bac821358',
    EEG_AF8: '273e00054c4d454d96bef03bac821358',
    EEG_TP10: '273e00064c4d454d96bef03bac821358',
    EEG_AUX: '273e00074c4d454d96bef03bac821358',
}

const CHAR_UUIDS = MUSE_CHARACTERISTIC_UUIDS
