import fs, { WriteStream } from 'node:fs'

import koffi from 'koffi'
import {
    CharacteristicCallbacks,
    LslStreamOutlet,
    StreamOutlet,
} from '@neurodevs/node-lsl'

import MuseDeviceController, {
    type MuseControllerOptions,
    type MuseVariant,
} from './MuseDeviceController.js'

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

export default class MuseSGen2 implements MuseVariant {
    public static readonly streamQueries = [
        'type="EEG"',
        'type="PPG"',
        'type="GYRO"',
        'type="ACCEL"',
    ]

    // p50 = 5-channel EEG + PPG + accel + gyro
    public static readonly startCommands = ['h', 'p50', 's', 'd']

    protected static readonly charUuids = MUSE_CHAR_UUIDS

    private static readonly eegSampleRateHz = 256
    private static readonly eegChunkSize = 12

    protected static readonly eegCharNames = [
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

    public readonly charCallbacks: CharacteristicCallbacks
    public readonly streamQueries = MuseSGen2.streamQueries
    public readonly startCommands = MuseSGen2.startCommands

    protected constructor(charCallbacks: CharacteristicCallbacks) {
        this.charCallbacks = charCallbacks
    }

    public static async Create(options?: MuseControllerOptions) {
        const { disableEeg, disablePpg, disableGyro, disableAccel, bleUuid } =
            options ?? {}

        const shortUuid = (bleUuid ?? '').slice(0, 6)

        const eegOutlet = !disableEeg
            ? await this.EegOutlet(shortUuid)
            : undefined
        const ppgOutlet = !disablePpg
            ? await this.PpgOutlet(shortUuid)
            : undefined
        const gyroOutlet = !disableGyro
            ? await this.GyroOutlet(shortUuid)
            : undefined
        const accelOutlet = !disableAccel
            ? await this.AccelOutlet(shortUuid)
            : undefined

        const charCallbacks = this.generateCharCallbacks(
            options,
            eegOutlet,
            ppgOutlet,
            gyroOutlet,
            accelOutlet
        )

        return new this(charCallbacks)
    }

    private static generateCharCallbacks(
        options?: MuseControllerOptions,
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
        } = options ?? {}

        const log = enableLogs ? MuseDeviceController.log : undefined

        const stream = txtRecordPath
            ? MuseDeviceController.createWriteStream(txtRecordPath, {
                  flags: 'a',
              })
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

                const bytes = Array.from<number>(
                    koffi.decode(data, 'uint8', length)
                )

                const msg = `${name.padEnd(13)} | ${timestampSec.toFixed(5).padEnd(15)} | ${JSON.stringify(bytes)}`
                stream?.write(`${msg}\n`)
                log?.(msg)

                handleData(name, bytes, timestampSec)
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

        return (charName: string, bytes: number[], timestampSec: number) => {
            const charIdx = this.eegCharNames.indexOf(charName)

            if (charIdx === 0) {
                t0 = timestampSec
            }

            charChunks[charIdx] = this.decodeEegCharChunk(bytes.slice(2))

            if (charIdx === this.eegCharNames.length - 1) {
                for (let i = 0; i < this.eegChunkSize; i++) {
                    const sample = charChunks.map((c) => c[i])

                    const ts = t0 + i / this.eegSampleRateHz
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

        return (charName: string, bytes: number[], timestampSec: number) => {
            const charIdx = this.ppgCharNames.indexOf(charName)

            if (charIdx === 0) {
                t0 = timestampSec
            }

            charChunks[charIdx] = this.decodePpgCharChunk(bytes.slice(2))

            if (charIdx === this.ppgCharNames.length - 1) {
                for (let i = 0; i < this.ppgChunkSize; i++) {
                    const sample = charChunks.map((c) => c[i])

                    const ts = t0 + i / this.ppgSampleRateHz
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
        return (bytes: number[], timestampSec: number) => {
            const samples = this.decodeImuPacket(bytes, scale)

            samples.forEach((sample, i) => {
                const ts = timestampSec + i / this.imuSampleRateHz
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

    private static async EegOutlet(shortUuid: string) {
        return await LslStreamOutlet.Create({
            name: `Muse EEG (${shortUuid})`,
            type: 'EEG',
            channelNames: this.eegCharNames,
            sampleRateHz: this.eegSampleRateHz,
            channelFormat: 'float32',
            sourceId: `muse-eeg-${shortUuid}`,
            manufacturer: 'Interaxon Inc.',
            units: 'microvolt',
            chunkSize: 1,
        })
    }

    private static async PpgOutlet(shortUuid: string) {
        return await LslStreamOutlet.Create({
            name: `Muse PPG (${shortUuid})`,
            type: 'PPG',
            channelNames: ['PPG_AMBIENT', 'PPG_INFRARED', 'PPG_RED'],
            sampleRateHz: 64,
            channelFormat: 'float32',
            sourceId: `muse-ppg-${shortUuid}`,
            manufacturer: 'Interaxon Inc.',
            units: 'N/A',
            chunkSize: 1,
        })
    }

    private static async GyroOutlet(shortUuid: string) {
        return await LslStreamOutlet.Create({
            name: `Muse Gyroscope (${shortUuid})`,
            type: 'GYRO',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: this.imuSampleRateHz,
            channelFormat: 'float32',
            sourceId: `muse-gyroscope-${shortUuid}`,
            manufacturer: 'Interaxon Inc.',
            units: 'degrees/s',
            chunkSize: 1,
        })
    }

    private static async AccelOutlet(shortUuid: string) {
        return await LslStreamOutlet.Create({
            name: `Muse Accelerometer (${shortUuid})`,
            type: 'ACCEL',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: this.imuSampleRateHz,
            channelFormat: 'float32',
            sourceId: `muse-accelerometer-${shortUuid}`,
            manufacturer: 'Interaxon Inc.',
            units: 'g',
            chunkSize: 1,
        })
    }
}
