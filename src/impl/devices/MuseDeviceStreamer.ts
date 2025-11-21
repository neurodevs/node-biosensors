import { TextEncoder } from 'util'
import {
    SimpleCharacteristic,
    Characteristic,
    ScanOptions,
    BleConnector,
    BleDeviceConnector,
} from '@neurodevs/node-ble'
import {
    ChannelFormat,
    StreamOutlet,
    StreamOutletOptions,
    LslStreamOutlet,
} from '@neurodevs/node-lsl'

import {
    DeviceStreamer,
    DeviceStreamerOptions,
} from 'impl/BiosensorDeviceFactory.js'

export default class MuseDeviceStreamer implements BleDeviceStreamer {
    public static Class?: MuseDeviceStreamerConstructor
    public static readonly streamQueries = ['type="EEG"', 'type="PPG"']

    protected bleConnector?: BleConnector
    private scanOptions: ScanOptions
    private eegOutlet: StreamOutlet
    private ppgOutlet: StreamOutlet
    private _bleUuid?: string
    private rssiIntervalMs?: number
    private eegChannelChunks = this.generateEmptyEegMatrix()
    private ppgChannelChunks = this.generateEmptyPpgMatrix()
    private encoder: TextEncoder

    protected constructor(options: MuseDeviceStreamerConstructorOptions) {
        const { eegOutlet, ppgOutlet, bleUuid, rssiIntervalMs } = options

        this.eegOutlet = eegOutlet
        this.ppgOutlet = ppgOutlet
        this._bleUuid = bleUuid
        this.rssiIntervalMs = rssiIntervalMs

        this.encoder = this.TextEncoder()
        this.scanOptions = this.generateScanOptions()
    }

    public static async Create(options?: MuseDeviceStreamerOptions) {
        return new (this.Class ?? this)({
            ...options,
            eegOutlet: await this.LslStreamOutlet(this.eegOutletOptions),
            ppgOutlet: await this.LslStreamOutlet(this.ppgOutletOptions),
        })
    }

    public async startStreaming() {
        await this.createBleConnectorIfNotExists()
        await this.writeStartCommandsToControl()
    }

    private async createBleConnectorIfNotExists() {
        if (!this.bleConnector) {
            this.bleConnector = await this.BleDeviceConnector()
        }
    }

    private async writeStartCommandsToControl() {
        for (const command of ['h', 'p50', 's', 'd']) {
            const buffer = this.createBufferFrom(command)
            await this.control.writeAsync(buffer, true)
        }
    }

    private createBufferFrom(cmd: string) {
        const encoded = this.encoder.encode(`X${cmd}\n`)
        encoded[0] = encoded.length - 1
        return Buffer.from(encoded)
    }

    private get control() {
        return this.bleController.getCharacteristic(this.controlUuid)!
    }

    private get controlUuid() {
        return CHAR_UUIDS.CONTROL
    }

    public async stopStreaming() {
        if (this.bleConnector) {
            await this.writeHaltCommandToControl()
        }
    }

    private async writeHaltCommandToControl() {
        await this.control.writeAsync(this.haltCmdBuffer, true)
    }

    private get haltCmdBuffer() {
        return this.createBufferFrom('h')
    }

    public async disconnect() {
        await this.stopStreaming()
        await this.disconnectBle()

        this.destroyStreamOutlets()
    }

    private destroyStreamOutlets() {
        this.eegOutlet.destroy()
        this.ppgOutlet.destroy()
    }

    private async disconnectBle() {
        if (this.bleConnector) {
            await this.bleConnector!.disconnectBle()
            delete this.bleConnector
        }
    }

    private generateScanOptions() {
        return {
            characteristicCallbacks: this.generateCharCallbacks(),
            rssiIntervalMs: this.rssiIntervalMs,
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
        const channelValuesForChunk = Array.from(data).slice(2)
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
        const channelValuesForChunk = Array.from(data).slice(2)
        const channelIdx = this.getPpgChannelIdx(char.uuid)

        const decoded = this.decodeUnsigned24BitData(channelValuesForChunk)

        this.ppgChannelChunks[channelIdx] = decoded

        if (this.isLastPpgChannel(channelIdx)) {
            this.pushPpgSamples()
        }
    }

    private getPpgChannelIdx(charUuid: string) {
        return this.ppgCharUuids.indexOf(charUuid)
    }

    private decodeUnsigned24BitData(samples: number[]) {
        const decodedSamples = []
        const numBytesPerSample = 3

        for (let i = 0; i < samples.length; i += numBytesPerSample) {
            const mostSignificantByte = samples[i] << 16
            const middleByte = samples[i + 1] << 8
            const leastSignificantByte = samples[i + 2]

            const val = mostSignificantByte | middleByte | leastSignificantByte
            decodedSamples.push(val)
        }

        return decodedSamples
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

    public get outlets() {
        return [this.eegOutlet, this.ppgOutlet]
    }

    public readonly streamQueries = MuseDeviceStreamer.streamQueries

    public get bleUuid() {
        return this.bleController.uuid
    }

    public get bleName() {
        return this.bleController.name
    }

    private get bleController() {
        return this.bleConnector!.getBleController()
    }

    private generateEmptyEegMatrix() {
        return this.generateEmptyMatrix(this.eegNumChannels, this.eegChunkSize)
    }

    private generateEmptyPpgMatrix() {
        return this.generateEmptyMatrix(this.ppgNumChannels, this.ppgChunkSize)
    }

    private generateEmptyMatrix(rows: number, columns: number) {
        return Array.from({ length: rows }, () =>
            new Array(columns).fill(0)
        ) as number[][]
    }

    private static readonly eegChunkSize = 12
    private static readonly eegsampleRateHz = 256
    private static readonly ppgChunkSize = 6
    private static readonly ppgsampleRateHz = 64

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
        sampleRateHz: this.eegsampleRateHz,
        channelFormat: 'float32' as ChannelFormat,
        sourceId: 'muse-eeg',
        manufacturer: 'Interaxon Inc.',
        units: 'microvolt',
        chunkSize: this.eegChunkSize,
        maxBufferedMs: 360,
    }

    private static readonly ppgOutletOptions = {
        name: 'Muse S Gen 2 PPG',
        type: 'PPG',
        channelNames: this.ppgCharacteristicNames,
        sampleRateHz: this.ppgsampleRateHz,
        channelFormat: 'float32' as ChannelFormat,
        sourceId: 'muse-s-ppg',
        manufacturer: 'Interaxon Inc.',
        units: 'N/A',
        chunkSize: this.ppgChunkSize,
        maxBufferedMs: 360,
    }

    private readonly bleLocalName = 'MuseS'

    private readonly eegCharNames = MuseDeviceStreamer.eegCharacteristicNames
    private readonly eegChunkSize = MuseDeviceStreamer.eegChunkSize
    private readonly eegNumChannels = this.eegCharNames.length

    private readonly ppgCharNames = MuseDeviceStreamer.ppgCharacteristicNames
    private readonly ppgChunkSize = MuseDeviceStreamer.ppgChunkSize
    private readonly ppgNumChannels = this.ppgCharNames.length

    private readonly eegCharUuids = this.eegCharNames.map(
        (name) => CHAR_UUIDS[name]
    )

    private readonly ppgCharUuids = this.ppgCharNames.map(
        (name) => CHAR_UUIDS[name]
    )

    private TextEncoder() {
        return new TextEncoder()
    }

    private async BleDeviceConnector() {
        return await BleDeviceConnector.Create({
            scanOptions: this.scanOptions,
            deviceLocalName: this.bleLocalName,
            deviceUuid: this._bleUuid,
            connectBleOnCreate: true,
        })
    }

    private static async LslStreamOutlet(options: StreamOutletOptions) {
        return await LslStreamOutlet.Create(options)
    }
}

export interface BleDeviceStreamer extends DeviceStreamer {
    readonly bleUuid: string
    readonly bleName: string
}

export interface MuseDeviceStreamerOptions extends DeviceStreamerOptions {
    bleUuid?: string
    rssiIntervalMs?: number
}

export type MuseDeviceStreamerConstructor = new (
    options: MuseDeviceStreamerConstructorOptions
) => BleDeviceStreamer

export interface MuseDeviceStreamerConstructorOptions {
    eegOutlet: StreamOutlet
    ppgOutlet: StreamOutlet
    bleUuid?: string
    rssiIntervalMs?: number
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
