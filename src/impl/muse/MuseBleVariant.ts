import fs, { WriteStream } from 'node:fs'

import koffi from 'koffi'
import {
    CharacteristicCallbacks,
    ClockRegressor,
    LslStreamOutlet,
    LslOutlet,
    WindowedClockRegressor,
} from '@neurodevs/node-lsl'

import MuseDeviceController, {
    MuseStream,
    MuseVariant,
    MuseVariantConstructorOptions,
    MuseVariantOptions,
} from './MuseDeviceController.js'

export default class MuseBleVariant implements MuseVariant {
    protected static readonly streamQueries = [
        'type="EEG"',
        'type="PPG"',
        'type="GYRO"',
        'type="ACCEL"',
    ]

    protected static readonly charUuids: Record<string, string>
    protected static readonly eegCharNames: string[]

    private static readonly eegSampleRateHz = 256
    private static readonly eegChunkSize = 12

    private static readonly ppgSampleRateHz = 64
    private static readonly ppgChunkSize = 6

    protected static readonly eegCharNames5Ch = [
        'EEG_TP10',
        'EEG_AF8',
        'EEG_TP9',
        'EEG_AF7',
        'EEG_AUX',
    ]

    protected static readonly eegCharNames4Ch = this.eegCharNames5Ch.filter(
        (name) => name !== 'EEG_AUX'
    )

    protected static readonly charUuids5ChEeg = {
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

    protected static readonly charUuids4ChEeg = Object.fromEntries(
        Object.entries(this.charUuids5ChEeg).filter(
            ([name]) => name !== 'EEG_AUX'
        )
    )

    private static readonly ppgCharNames = [
        'PPG_AMBIENT',
        'PPG_INFRARED',
        'PPG_RED',
    ]

    private static readonly imuSampleRateHz = 52
    private static readonly imuChunkSize = 3

    private static readonly imuScales: Record<string, number> = {
        GYROSCOPE: 0.0074768,
        ACCELEROMETER: 0.0000610352,
    }

    public readonly charCallbacks: CharacteristicCallbacks
    public readonly startCommands: readonly string[] = []
    public readonly streamQueries: readonly string[]

    protected constructor(options: MuseVariantConstructorOptions) {
        const { charCallbacks, streamQueries } = options

        this.charCallbacks = charCallbacks
        this.streamQueries = streamQueries
    }

    public static async Create(
        options?: MuseVariantOptions
    ): Promise<MuseVariant> {
        const { bleUuid = '' } = options ?? {}

        const identifier = this.resolveIdentifier(bleUuid)
        const disabled = this.resolveDisabledStreams(options)

        const eegOutlet = !disabled.has('EEG')
            ? await this.EegOutlet(identifier)
            : undefined
        const ppgOutlet = !disabled.has('PPG')
            ? await this.PpgOutlet(identifier)
            : undefined
        const gyroOutlet = !disabled.has('Gyroscope')
            ? await this.GyroOutlet(identifier)
            : undefined
        const accelOutlet = !disabled.has('Accelerometer')
            ? await this.AccelOutlet(identifier)
            : undefined

        const charCallbacks = this.generateCharCallbacks(
            options,
            {
                EEG: eegOutlet,
                PPG: ppgOutlet,
                Gyroscope: gyroOutlet,
                Accelerometer: accelOutlet,
            },
            {
                EEG: this.WindowedClockRegressor(this.eegSampleRateHz),
                PPG: this.WindowedClockRegressor(this.ppgSampleRateHz),
                Gyroscope: this.WindowedClockRegressor(this.imuSampleRateHz),
                Accelerometer: this.WindowedClockRegressor(
                    this.imuSampleRateHz
                ),
            }
        )

        return new this({ charCallbacks, streamQueries: this.streamQueries })
    }

    protected static resolveIdentifier(bleUuid?: string) {
        return bleUuid
            ? bleUuid.slice(0, 6)
            : `Device-${MuseDeviceController.fallbackDeviceCounter++}`
    }

    private static generateCharCallbacks(
        options: MuseVariantOptions | undefined,
        outlets: Partial<Record<MuseStream, LslOutlet>>,
        regressors: Partial<Record<MuseStream, ClockRegressor>>
    ) {
        const { log, txtStream } = this.resolveLogAndStream(options)

        const disabled = this.resolveDisabledStreams(options)

        const disabledChars = new Set<string>([
            ...(disabled.has('EEG') ? this.eegCharNames : []),
            ...(disabled.has('PPG') ? this.ppgCharNames : []),
            ...(disabled.has('Gyroscope') ? ['GYROSCOPE'] : []),
            ...(disabled.has('Accelerometer') ? ['ACCELEROMETER'] : []),
        ])

        const handleEeg = this.createEegHandler(
            log,
            txtStream,
            outlets.EEG,
            regressors.EEG
        )
        const handlePpg = this.createPpgHandler(
            log,
            txtStream,
            outlets.PPG,
            regressors.PPG
        )
        const handleGyro = this.createGyroHandler(
            log,
            txtStream,
            outlets.Gyroscope,
            regressors.Gyroscope
        )
        const handleAccel = this.createAccelHandler(
            log,
            txtStream,
            outlets.Accelerometer,
            regressors.Accelerometer
        )

        const handleData = (
            charName: string,
            bytes: number[],
            timestampSec: number
        ) => {
            switch (true) {
                case this.eegCharNames.includes(charName):
                    handleEeg(charName, bytes, timestampSec)
                    break
                case this.ppgCharNames.includes(charName):
                    handlePpg(charName, bytes, timestampSec)
                    break
                case charName === 'GYROSCOPE':
                    handleGyro(bytes, timestampSec)
                    break
                case charName === 'ACCELEROMETER':
                    handleAccel(bytes, timestampSec)
                    break
            }
        }

        return Object.entries(this.charUuids).map(([name, uuid]) => ({
            charUuid: uuid,
            charName: name,
            onData: (data: Buffer, length: number, timestampSec: number) => {
                if (disabledChars.has(name)) {
                    return
                }

                const bytes = this.decodeBytes(data, length)

                const msg = this.formatMessage(name, timestampSec, bytes)
                txtStream?.write(`${msg}\n`)
                log?.(msg)

                handleData(name, bytes, timestampSec)
            },
        }))
    }

    protected static resolveDisabledStreams(options?: MuseVariantOptions) {
        const { disableStreams } = options ?? {}
        return new Set(disableStreams ?? [])
    }

    protected static resolveLogAndStream(options?: MuseVariantOptions) {
        const { logLevel, txtStream } = options ?? {}

        const log =
            logLevel === 'info'
                ? (...args: any[]) => MuseDeviceController.log.info(...args)
                : undefined

        return { log, txtStream }
    }

    protected static decodeBytes(data: Buffer, length: number) {
        return Array.from<number>(koffi.decode(data, 'uint8', length))
    }

    protected static formatMessage(
        name: string,
        timestampSec: number,
        payload: unknown
    ) {
        return `${name.padEnd(13)} | ${timestampSec.toFixed(5).padEnd(15)} | ${JSON.stringify(payload)}`
    }

    private static createEegHandler(
        log?: (...data: any[]) => void,
        stream?: WriteStream,
        outlet?: LslOutlet,
        regressor?: ClockRegressor
    ) {
        const charChunks: number[][] = []
        const charCounters: number[] = []
        let t0 = 0
        let packetCounter = 0

        return (charName: string, bytes: number[], timestampSec: number) => {
            const charIdx = this.eegCharNames.indexOf(charName)

            if (charIdx === 0) {
                t0 = timestampSec
                packetCounter = this.readUInt16BE(bytes, 0)
            }

            charChunks[charIdx] = this.decodeEegCharChunk(bytes.slice(2))
            charCounters[charIdx] = this.readUInt16BE(bytes, 0)

            if (
                charIdx === this.eegCharNames.length - 1 &&
                this.isCompletePacket(charCounters, this.eegCharNames.length)
            ) {
                const pushTimestamps = this.derivePushTimestamps(
                    regressor,
                    (packetCounter * this.eegChunkSize) / this.eegSampleRateHz,
                    t0,
                    this.eegChunkSize
                )

                for (let i = 0; i < this.eegChunkSize; i++) {
                    const sample = charChunks.map((c) => c[i])

                    const ts = t0 + i / this.eegSampleRateHz
                    outlet?.pushSample(sample, pushTimestamps[i]!)

                    const msg = this.formatMessage('EEG', ts, sample)
                    stream?.write(`${msg}\n`)
                    log?.(msg)
                }
            }
        }
    }

    private static readUInt16BE(bytes: number[], offset: number) {
        return (bytes[offset]! << 8) | bytes[offset + 1]!
    }

    private static isCompletePacket(charCounters: number[], numChars: number) {
        return (
            charCounters.length === numChars &&
            charCounters.every((counter) => counter === charCounters[0])
        )
    }

    private static derivePushTimestamps(
        regressor: ClockRegressor | undefined,
        deviceTime: number,
        earliestLslTime: number,
        chunkSize: number
    ) {
        return (
            regressor?.deriveTimestamps(
                deviceTime,
                earliestLslTime,
                chunkSize
            ) ?? []
        )
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
        outlet?: LslOutlet,
        regressor?: ClockRegressor
    ) {
        const charChunks: number[][] = []
        let t0 = 0
        let packetCounter = 0

        return (charName: string, bytes: number[], timestampSec: number) => {
            const charIdx = this.ppgCharNames.indexOf(charName)

            if (charIdx === 0) {
                t0 = timestampSec
                packetCounter = this.readUInt16BE(bytes, 0)
            }

            charChunks[charIdx] = this.decodePpgCharChunk(bytes.slice(2))

            if (charIdx === this.ppgCharNames.length - 1) {
                const pushTimestamps = this.derivePushTimestamps(
                    regressor,
                    (packetCounter * this.ppgChunkSize) / this.ppgSampleRateHz,
                    t0,
                    this.ppgChunkSize
                )

                for (let i = 0; i < this.ppgChunkSize; i++) {
                    const sample = charChunks.map((c) => c[i])

                    const ts = t0 + i / this.ppgSampleRateHz
                    outlet?.pushSample(sample, pushTimestamps[i]!)

                    const msg = this.formatMessage('PPG', ts, sample)
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
        txtStream?: fs.WriteStream,
        outlet?: LslOutlet,
        regressor?: ClockRegressor
    ) {
        return this.createImuHandler(
            'ACCELEROMETER',
            { log, txtStream },
            outlet,
            regressor
        )
    }

    private static createGyroHandler(
        log?: (...data: any[]) => void,
        txtStream?: fs.WriteStream,
        outlet?: LslOutlet,
        regressor?: ClockRegressor
    ) {
        return this.createImuHandler(
            'GYROSCOPE',
            { log, txtStream },
            outlet,
            regressor
        )
    }

    private static createImuHandler(
        name: string,
        logAndStream: ReturnType<typeof MuseBleVariant.resolveLogAndStream>,
        outlet?: LslOutlet,
        regressor?: ClockRegressor
    ) {
        const { log, txtStream: stream } = logAndStream
        const scale = this.imuScales[name]!

        return (bytes: number[], timestampSec: number) => {
            const samples = this.decodeImuPacket(bytes, scale)
            const packetCounter = this.readUInt16BE(bytes, 0)

            const pushTimestamps = this.derivePushTimestamps(
                regressor,
                (packetCounter * this.imuChunkSize) / this.imuSampleRateHz,
                timestampSec,
                this.imuChunkSize
            )

            samples.forEach((sample, i) => {
                const ts = timestampSec + i / this.imuSampleRateHz
                outlet?.pushSample(sample, pushTimestamps[i]!)

                const msg = this.formatMessage(name, ts, sample)
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

    protected static WindowedClockRegressor(nominalHz: number) {
        return WindowedClockRegressor.Create(nominalHz)
    }

    protected static async LslOutlet(params: {
        name: string
        type: string
        channelNames: string[]
        sampleRateHz: number
        sourceId: string
        units: string
    }) {
        return await LslStreamOutlet.Create({
            ...params,
            channelFormat: 'float32',
            manufacturer: 'Interaxon Inc.',
            chunkSize: 1,
        })
    }

    private static async EegOutlet(identifier: string) {
        return await this.LslOutlet({
            name: `Muse EEG (${identifier})`,
            type: 'EEG',
            channelNames: this.eegCharNames,
            sampleRateHz: this.eegSampleRateHz,
            sourceId: `muse-eeg-${identifier}`,
            units: 'microvolt',
        })
    }

    private static async PpgOutlet(identifier: string) {
        return await this.LslOutlet({
            name: `Muse PPG (${identifier})`,
            type: 'PPG',
            channelNames: ['PPG_AMBIENT', 'PPG_INFRARED', 'PPG_RED'],
            sampleRateHz: 64,
            sourceId: `muse-ppg-${identifier}`,
            units: 'N/A',
        })
    }

    private static async GyroOutlet(identifier: string) {
        return await this.LslOutlet({
            name: `Muse Gyroscope (${identifier})`,
            type: 'GYRO',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: this.imuSampleRateHz,
            sourceId: `muse-gyroscope-${identifier}`,
            units: 'degrees/s',
        })
    }

    private static async AccelOutlet(identifier: string) {
        return await this.LslOutlet({
            name: `Muse Accelerometer (${identifier})`,
            type: 'ACCEL',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: this.imuSampleRateHz,
            sourceId: `muse-accelerometer-${identifier}`,
            units: 'g',
        })
    }
}
