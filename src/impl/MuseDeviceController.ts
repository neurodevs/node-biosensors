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

    private static readonly imuSampleRateHz = 52
    private static readonly imuChunkSize = 3

    protected readonly ble: BleController

    protected isConnected = false
    protected isStreaming = false

    protected constructor(ble: BleController) {
        this.ble = ble
    }

    public static async Create(options: MuseControllerOptions) {
        const { disableEeg, disablePpg, disableGyro, disableAccel } = options

        const eegOutlet = !disableEeg ? await this.EegOutlet() : undefined
        const ppgOutlet = !disablePpg ? await this.PpgOutlet() : undefined
        const gyroOutlet = !disableGyro ? await this.GyroOutlet() : undefined
        const accelOutlet = !disableAccel ? await this.AccelOutlet() : undefined

        const charCallbacks = this.generateCharCallbacks(
            options,
            eegOutlet,
            ppgOutlet,
            gyroOutlet,
            accelOutlet
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
        ppgOutlet?: StreamOutlet,
        gyroOutlet?: StreamOutlet,
        accelOutlet?: StreamOutlet
    ) {
        const {
            enableLogs,
            txtRecordPath,
            disableEeg,
            disablePpg,
            disableGyro,
            disableAccel,
        } = options

        const log = enableLogs ? this.log : undefined

        const stream = txtRecordPath
            ? this.createWriteStream(txtRecordPath, { flags: 'a' })
            : undefined

        const disabledChars = new Set<string>([
            ...(disableEeg ? this.eegCharNames : []),
            ...(disablePpg ? this.ppgCharNames : []),
            ...(disableGyro ? ['GYROSCOPE'] : []),
            ...(disableAccel ? ['ACCELEROMETER'] : []),
        ])

        const handleEeg = this.createEegHandler(log, stream, eegOutlet)
        const handlePpg = this.createPpgHandler(log, stream, ppgOutlet)
        const handleGyro = this.createGyroHandler(log, stream, gyroOutlet)
        const handleAccel = this.createAccelHandler(log, stream, accelOutlet)

        const handleData = (
            charName: string,
            bytes: number[],
            timestamp: number
        ) => {
            switch (true) {
                case this.eegCharNames.includes(charName):
                    handleEeg(charName, bytes, timestamp)
                    break
                case this.ppgCharNames.includes(charName):
                    handlePpg(charName, bytes, timestamp)
                    break
                case charName === 'GYROSCOPE':
                    handleGyro(bytes, timestamp)
                    break
                case charName === 'ACCELEROMETER':
                    handleAccel(bytes, timestamp)
                    break
            }
        }

        return Object.entries(MUSE_CHAR_UUIDS).map(([name, uuid]) => ({
            charUuid: uuid,
            charName: name,
            onData: (data: Buffer, length: number, timestamp: number) => {
                if (disabledChars.has(name)) {
                    return
                }

                const bytes = Array.from<number>(
                    koffi.decode(data, 'uint8', length)
                )

                const msg = `${name.padEnd(13)} | ${timestamp.toFixed(5).padEnd(15)} | ${JSON.stringify(bytes)}`
                stream?.write(`${msg}\n`)
                log?.(msg)

                handleData(name, bytes, timestamp)
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

            if (charIdx === 0) {
                t0 = timestamp
            }

            charChunks[charIdx] = this.decodeEegCharChunk(bytes.slice(2))

            if (charIdx === this.eegCharNames.length - 1) {
                for (let i = 0; i < this.eegChunkSize; i++) {
                    const sample = charChunks.map((c) => c[i])

                    const ts = t0 + (1000 * i) / this.eegSampleRateHz
                    eegOutlet?.pushSample(sample, ts)

                    const msg = `${'EEG'.padEnd(13)} | ${ts.toFixed(5).padEnd(15)} | ${JSON.stringify(sample)}`
                    stream?.write(`${msg}\n`)
                    log?.(msg)
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

            if (charIdx === 0) {
                t0 = timestamp
            }

            charChunks[charIdx] = this.decodePpgCharChunk(bytes.slice(2))

            if (charIdx === this.ppgCharNames.length - 1) {
                for (let i = 0; i < this.ppgChunkSize; i++) {
                    const sample = charChunks.map((c) => c[i])

                    const ts = t0 + (1000 * i) / this.ppgSampleRateHz
                    ppgOutlet?.pushSample(sample, ts)

                    const msg = `${'PPG'.padEnd(13)} | ${ts.toFixed(5).padEnd(15)} | ${JSON.stringify(sample)}`
                    stream?.write(`${msg}\n`)
                    log?.(msg)
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

    private static createAccelHandler(
        log?: (...data: any[]) => void,
        stream?: fs.WriteStream,
        accelOutlet?: StreamOutlet
    ) {
        return this.createImuHandler(
            'ACCELEROMETER',
            0.0000610352,
            log,
            stream,
            accelOutlet
        )
    }

    private static createGyroHandler(
        log?: (...data: any[]) => void,
        stream?: fs.WriteStream,
        gyroOutlet?: StreamOutlet
    ) {
        return this.createImuHandler(
            'GYROSCOPE',
            0.0074768,
            log,
            stream,
            gyroOutlet
        )
    }

    private static createImuHandler(
        name: string,
        scale: number,
        log?: (...data: any[]) => void,
        stream?: WriteStream,
        outlet?: StreamOutlet
    ) {
        return (bytes: number[], timestamp: number) => {
            const samples = this.decodeImuPacket(bytes, scale)

            samples.forEach((sample, i) => {
                const ts = timestamp + (1000 * i) / this.imuSampleRateHz
                outlet?.pushSample(sample, ts)

                const msg = `${name.padEnd(13)} | ${ts.toFixed(5).padEnd(15)} | ${JSON.stringify(sample)}`
                stream?.write(`${msg}\n`)
                log?.(msg)
            })
        }
    }

    private static decodeImuPacket(bytes: number[], scale: number) {
        const samples: number[][] = []

        for (let i = 0; i < this.imuChunkSize; i++) {
            const x = this.readInt16BE(bytes, 2 + i * 2)
            const y = this.readInt16BE(bytes, 2 + (i + 3) * 2)
            const z = this.readInt16BE(bytes, 2 + (i + 6) * 2)
            samples.push([x * scale, y * scale, z * scale])
        }

        return samples
    }

    private static readInt16BE(bytes: number[], offset: number) {
        const value = (bytes[offset]! << 8) | bytes[offset + 1]!
        return value >= 0x8000 ? value - 0x10000 : value
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

    private static async EegOutlet() {
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

    private static async PpgOutlet() {
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

    private static async GyroOutlet() {
        return await LslStreamOutlet.Create({
            name: 'Muse Gyroscope',
            type: 'Gyroscope',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: this.imuSampleRateHz,
            channelFormat: 'float32',
            sourceId: 'muse-gyroscope',
            manufacturer: 'Interaxon Inc.',
            units: 'degrees/s',
            chunkSize: 1,
        })
    }

    private static async AccelOutlet() {
        return await LslStreamOutlet.Create({
            name: 'Muse Accelerometer',
            type: 'Accelerometer',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: this.imuSampleRateHz,
            channelFormat: 'float32',
            sourceId: 'muse-accelerometer',
            manufacturer: 'Interaxon Inc.',
            units: 'g',
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
    disableGyro?: boolean
    disableAccel?: boolean
}

export type MuseControllerConstructor = new (
    ble: BleController
) => MuseController
