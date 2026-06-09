import fs, { WriteStream } from 'fs'
import {
    BleController,
    BleDeviceController,
    CharacteristicCallbacks,
    LslStreamOutlet,
    StreamOutlet,
} from '@neurodevs/node-lsl'
import koffi from 'koffi'

export const MUSE_CHAR_UUIDS: Record<string, string> = {
    CONTROL: '273E0001-4C4D-454D-96BE-F03BAC821358',
    TELEMETRY: '273E000B-4C4D-454D-96BE-F03BAC821358',
    GYROSCOPE: '273E0009-4C4D-454D-96BE-F03BAC821358',
    ACCELEROMETER: '273E000A-4C4D-454D-96BE-F03BAC821358',
    PPG_AMBIENT: '273E000F-4C4D-454D-96BE-F03BAC821358',
    PPG_INFRARED: '273E0010-4C4D-454D-96BE-F03BAC821358',
    PPG_RED: '273E0011-4C4D-454D-96BE-F03BAC821358',
    EEG_TP9: '273E0003-4C4D-454D-96BE-F03BAC821358',
    EEG_AF7: '273E0004-4C4D-454D-96BE-F03BAC821358',
    EEG_AF8: '273E0005-4C4D-454D-96BE-F03BAC821358',
    EEG_TP10: '273E0006-4C4D-454D-96BE-F03BAC821358',
    EEG_AUX: '273E0007-4C4D-454D-96BE-F03BAC821358',
}

export const CONTROL_UUID = MUSE_CHAR_UUIDS['CONTROL']

export default class MuseDeviceController implements MuseController {
    public static Class?: MuseControllerConstructor
    public static createWriteStream = fs.createWriteStream
    public static log = console.info

    private static readonly eegSampleRateHz = 256
    private static readonly eegChunkSize = 12

    private static readonly eegCharNames = [
        'EEG_TP10',
        'EEG_AF8',
        'EEG_TP9',
        'EEG_AF7',
        'EEG_AUX',
    ]

    private static readonly ppgSampleRateHz = 64
    private static readonly ppgChunkSize = 6

    private static readonly ppgCharNames = [
        'PPG_AMBIENT',
        'PPG_INFRARED',
        'PPG_RED',
    ]

    protected readonly ble: BleController

    protected isConnected = false
    protected isStreaming = false

    protected constructor(ble: BleController) {
        this.ble = ble
    }

    public static async Create(options: MuseControllerOptions) {
        const { disableEeg, disablePpg } = options

        const eegOutlet = !disableEeg ? await this.EegLslOutlet() : undefined
        const ppgOutlet = !disablePpg ? await this.PpgLslOutlet() : undefined

        const charCallbacks = this.generateCharCallbacks(
            options,
            eegOutlet,
            ppgOutlet
        )
        const ble = await this.BleDeviceController(options, charCallbacks)

        return new (this.Class ?? this)(ble)
    }

    public async connect() {
        await this.idempotentConnect()
        this.isConnected = true
    }

    private async idempotentConnect() {
        if (!this.isConnected) {
            await this.ble.connect()
        } else {
            console.warn(`Already connected to ${this.bleUuid}.`)
        }
    }

    public async startStreaming() {
        await this.idempotentStartStreaming()
        this.isStreaming = true
    }

    private async idempotentStartStreaming() {
        if (!this.isStreaming) {
            await this.writeStartStreamingCommands()
        } else {
            console.warn(`Already streaming from ${this.bleUuid}.`)
        }
    }

    private async writeStartStreamingCommands() {
        for (const cmd of ['h', 'p50', 's', 'd']) {
            await this.ble.writeCharacteristic(CONTROL_UUID, cmd)
        }
    }

    public async stopStreaming() {
        await this.idempotentStopStreaming()
        this.isStreaming = false
    }

    private async idempotentStopStreaming() {
        if (this.isStreaming) {
            await this.ble.writeCharacteristic(CONTROL_UUID, 'h')
        } else {
            console.warn(`Not streaming from ${this.bleUuid}.`)
        }
    }

    public async disconnect() {
        if (this.isStreaming) {
            await this.stopStreaming()
        }
        await this.idempotentDisconnect()
        this.isConnected = false
    }

    private async idempotentDisconnect() {
        if (this.isConnected) {
            await this.ble.disconnect()
        } else {
            console.warn(`Already disconnected from ${this.bleUuid}.`)
        }
    }

    public get bleUuid() {
        return this.ble.uuid
    }

    public get bleName() {
        return this.ble.name
    }

    private static generateCharCallbacks(
        options: MuseControllerOptions,
        eegOutlet?: StreamOutlet,
        ppgOutlet?: StreamOutlet
    ) {
        const { enableLogs, txtRecordPath } = options
        const log = enableLogs ? this.log : undefined

        const stream = txtRecordPath
            ? this.createWriteStream(txtRecordPath, { flags: 'a' })
            : undefined

        const handleEeg = this.createEegHandler(log, stream, eegOutlet)
        const handlePpg = this.createPpgHandler(log, stream, ppgOutlet)

        return Object.entries(MUSE_CHAR_UUIDS).map(([name, uuid]) => ({
            charUuid: uuid,
            charName: name,
            onData: (data: Buffer, length: number, timestamp: number) => {
                const bytes = Array.from<number>(
                    koffi.decode(data, 'uint8', length)
                )

                const msg = `${name.padEnd(13)} | ${timestamp.toFixed(5).padEnd(15)} | ${JSON.stringify(bytes)}`
                stream?.write(`${msg}\n`)
                log?.(msg)

                handleEeg(name, bytes, timestamp)
                handlePpg(name, bytes, timestamp)
            },
        }))
    }

    private static createEegHandler(
        log?: (...data: any[]) => void,
        stream?: WriteStream,
        eegOutlet?: StreamOutlet
    ) {
        const charChunks: number[][] = []
        let t0 = 0

        return (charName: string, bytes: number[], timestamp: number) => {
            const charIdx = this.eegCharNames.indexOf(charName)

            if (eegOutlet && charIdx !== -1) {
                if (charIdx === 0) {
                    t0 = timestamp
                }

                charChunks[charIdx] = this.decodeEegCharChunk(bytes.slice(2))

                if (charIdx === this.eegCharNames.length - 1) {
                    for (let i = 0; i < this.eegChunkSize; i++) {
                        const sample = charChunks.map((c) => c[i])

                        const ts = t0 + (1000 * i) / this.eegSampleRateHz
                        eegOutlet.pushSample(sample, ts)

                        const msg = `${'EEG'.padEnd(13)} | ${ts.toFixed(5).padEnd(15)} | ${JSON.stringify(sample)}`
                        stream?.write(`${msg}\n`)
                        log?.(msg)
                    }
                }
            }
        }
    }

    private static decodeEegCharChunk(bytes: number[]) {
        const decoded: number[] = []

        for (let i = 0; i < bytes.length; i += 3) {
            const first = (bytes[i]! << 4) | (bytes[i + 1]! >> 4)
            const second = ((bytes[i + 1]! & 0x0f) << 8) | bytes[i + 2]!

            decoded.push(first, second)
        }

        const decodedInMicrovolts = decoded.map((c) => {
            return 0.48828125 * (c - 2048)
        })

        return decodedInMicrovolts
    }

    private static createPpgHandler(
        log?: (...data: any[]) => void,
        stream?: WriteStream,
        ppgOutlet?: StreamOutlet
    ) {
        const charChunks: number[][] = []
        let t0 = 0

        return (charName: string, bytes: number[], timestamp: number) => {
            const charIdx = this.ppgCharNames.indexOf(charName)

            if (ppgOutlet && charIdx !== -1) {
                if (charIdx === 0) {
                    t0 = timestamp
                }

                charChunks[charIdx] = this.decodePpgCharChunk(bytes.slice(2))

                if (charIdx === this.ppgCharNames.length - 1) {
                    for (let i = 0; i < this.ppgChunkSize; i++) {
                        const sample = charChunks.map((c) => c[i])

                        const ts = t0 + (1000 * i) / this.ppgSampleRateHz
                        ppgOutlet.pushSample(sample, ts)

                        const msg = `${'PPG'.padEnd(13)} | ${ts.toFixed(5).padEnd(15)} | ${JSON.stringify(sample)}`
                        stream?.write(`${msg}\n`)
                        log?.(msg)
                    }
                }
            }
        }
    }

    private static decodePpgCharChunk(bytes: number[]) {
        const charSamples: number[] = []

        for (let i = 0; i < bytes.length; i += 3) {
            charSamples.push(
                (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!
            )
        }

        return charSamples
    }

    private static async BleDeviceController(
        options: MuseControllerOptions,
        charCallbacks: CharacteristicCallbacks
    ) {
        const { bleUuid, rssiIntervalMs } = options

        return await BleDeviceController.Create({
            deviceUuid: bleUuid,
            charCallbacks,
            rssiIntervalMs,
        })
    }

    private static async EegLslOutlet() {
        return await LslStreamOutlet.Create({
            name: 'Muse EEG',
            type: 'EEG',
            channelNames: this.eegCharNames,
            sampleRateHz: this.eegSampleRateHz,
            channelFormat: 'float32',
            sourceId: 'muse-eeg',
            manufacturer: 'Interaxon Inc.',
            units: 'microvolt',
            chunkSize: 1,
        })
    }

    private static async PpgLslOutlet() {
        return await LslStreamOutlet.Create({
            name: 'Muse PPG',
            type: 'PPG',
            channelNames: ['PPG_AMBIENT', 'PPG_INFRARED', 'PPG_RED'],
            sampleRateHz: 64,
            channelFormat: 'float32',
            sourceId: 'muse-s-ppg',
            manufacturer: 'Interaxon Inc.',
            units: 'N/A',
            chunkSize: 1,
        })
    }
}

export interface MuseController {
    connect(): Promise<void>
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
    readonly bleUuid: string
    readonly bleName: string
}

export interface MuseControllerOptions {
    bleUuid: string
    enableLogs?: boolean
    rssiIntervalMs?: number
    txtRecordPath?: string
    disableEeg?: boolean
    disablePpg?: boolean
}

export type MuseControllerConstructor = new (
    ble: BleController
) => MuseController
