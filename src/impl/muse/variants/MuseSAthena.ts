import { WriteStream } from 'node:fs'

import koffi from 'koffi'
import {
    CharacteristicCallbacks,
    LslStreamOutlet,
    StreamOutlet,
    WindowedClockRegressor,
} from '@neurodevs/node-lsl'

import MuseDeviceController, {
    type MuseControllerOptions,
    type MuseVariant,
} from '../MuseDeviceController.js'

export const MUSE_ATHENA_CHAR_UUIDS: Record<string, string> = {
    CONTROL: '273E0001-4C4D-454D-96BE-F03BAC821358',
    EEG: '273E0013-4C4D-454D-96BE-F03BAC821358',
    OTHER: '273E0014-4C4D-454D-96BE-F03BAC821358',
}

const SENSORS: Record<number, SensorConfig> = {
    0x11: { type: 'EEG', nChannels: 4, nSamples: 4, rate: 256, dataLen: 28 },
    0x12: { type: 'EEG', nChannels: 8, nSamples: 2, rate: 256, dataLen: 28 },
    0x34: { type: 'OPTICS', nChannels: 4, nSamples: 3, rate: 64, dataLen: 30 },
    0x35: { type: 'OPTICS', nChannels: 8, nSamples: 2, rate: 64, dataLen: 40 },
    0x36: { type: 'OPTICS', nChannels: 16, nSamples: 1, rate: 64, dataLen: 40 },
    0x47: { type: 'IMU', nChannels: 6, nSamples: 3, rate: 52, dataLen: 36 },
    0x53: { type: 'Unknown', nChannels: 0, nSamples: 0, rate: 0, dataLen: 24 },
    0x88: {
        type: 'BATTERY',
        nChannels: 1,
        nSamples: 1,
        rate: 0.2,
        dataLen: 188,
    },
    0x98: { type: 'BATTERY', nChannels: 1, nSamples: 1, rate: 1, dataLen: 20 },
}

const PACKET_HEADER_SIZE = 14
const SUBPACKET_HEADER_SIZE = 5

const EEG_SCALE = 1450 / 16383
const OPTICS_SCALE = 1 / 32768
const ACC_SCALE = 0.0000610352
const GYRO_SCALE = -0.0074768

const SAMPLES_RATES_HZ: Record<string, number> = {
    EEG: 256,
    IMU: 52,
    OPTICS: 64,
}

const EXPECTED_CHANNELS: Record<string, number> = {
    EEG: 8,
    IMU: 6,
    OPTICS: 16,
}

const IMU_CHANNELS = ['ACC_X', 'ACC_Y', 'ACC_Z', 'GYRO_X', 'GYRO_Y', 'GYRO_Z']

const EEG_CHANNELS = [
    'EEG_TP9',
    'EEG_AF7',
    'EEG_AF8',
    'EEG_TP10',
    'AUX_1',
    'AUX_2',
    'AUX_3',
    'AUX_4',
]

const OPTICS_CHANNELS = [
    'OPTICS_LO_NIR',
    'OPTICS_RO_NIR',
    'OPTICS_LO_IR',
    'OPTICS_RO_IR',
    'OPTICS_LI_NIR',
    'OPTICS_RI_NIR',
    'OPTICS_LI_IR',
    'OPTICS_RI_IR',
    'OPTICS_LO_RED',
    'OPTICS_RO_RED',
    'OPTICS_LO_AMB',
    'OPTICS_RO_AMB',
    'OPTICS_LI_RED',
    'OPTICS_RI_RED',
    'OPTICS_LI_AMB',
    'OPTICS_RI_AMB',
]

export default class MuseSAthena implements MuseVariant {
    public static readonly streamQueries = [
        'type="EEG"',
        'type="IMU"',
        'type="PPG"',
    ]
    public static readonly startCommands = [
        'v6',
        's',
        'h',
        'p1041',
        'dc001',
        'dc001',
        'L1',
    ]

    public readonly charCallbacks: CharacteristicCallbacks
    public readonly streamQueries = MuseSAthena.streamQueries
    public readonly startCommands = MuseSAthena.startCommands

    protected constructor(charCallbacks: CharacteristicCallbacks) {
        this.charCallbacks = charCallbacks
    }

    public static async Create(options?: MuseControllerOptions) {
        const {
            disableEeg,
            disablePpg,
            disableGyro,
            disableAccel,
            bleUuid = '',
        } = options ?? {}

        const identifier = bleUuid
            ? bleUuid.slice(0, 6)
            : `Device-${MuseDeviceController.fallbackDeviceCounter++}`

        const disableImu = disableGyro && disableAccel

        const outlets: AthenaOutlets = {
            EEG: !disableEeg ? await this.EegOutlet(identifier) : undefined,
            IMU: !disableImu ? await this.ImuOutlet(identifier) : undefined,
            OPTICS: !disablePpg
                ? await this.OpticsOutlet(identifier)
                : undefined,
        }

        const charCallbacks = this.generateCharCallbacks(options, outlets)

        WindowedClockRegressor.Create(SAMPLES_RATES_HZ.EEG!)
        WindowedClockRegressor.Create(SAMPLES_RATES_HZ.IMU!)
        WindowedClockRegressor.Create(SAMPLES_RATES_HZ.OPTICS!)

        return new this(charCallbacks)
    }

    private static generateCharCallbacks(
        options: MuseControllerOptions | undefined,
        outlets: AthenaOutlets
    ) {
        const { enableLogs, txtRecordPath } = options ?? {}

        const log = enableLogs ? MuseDeviceController.log : undefined

        const stream = txtRecordPath
            ? MuseDeviceController.createWriteStream(txtRecordPath, {
                  flags: 'a',
              })
            : undefined

        const handleMessage = this.createMessageHandler(log, stream, outlets)

        const decodeBytes = (data: Buffer, length: number) =>
            Array.from<number>(koffi.decode(data, 'uint8', length))

        return Object.entries(MUSE_ATHENA_CHAR_UUIDS).map(([name, uuid]) => ({
            charUuid: uuid,
            charName: name,
            onData: (data: Buffer, length: number, timestampSec: number) => {
                if (name === 'CONTROL') {
                    return
                }
                handleMessage(decodeBytes(data, length), timestampSec)
            },
        }))
    }

    private static createMessageHandler(
        log: ((...data: any[]) => void) | undefined,
        stream: WriteStream | undefined,
        outlets: AthenaOutlets
    ) {
        return (bytes: number[], timestampSec: number) => {
            const samplesByType: Record<string, number[][]> = {
                EEG: [],
                IMU: [],
                OPTICS: [],
            }

            for (const packet of this.parsePackets(bytes)) {
                for (const subpacket of this.parseSubpackets(packet)) {
                    const decoded = this.decodeSubpacket(subpacket)
                    if (decoded) {
                        samplesByType[decoded.type]!.push(...decoded.samples)
                    }
                }
            }

            for (const [type, outlet] of [
                ['EEG', outlets.EEG],
                ['IMU', outlets.IMU],
                ['OPTICS', outlets.OPTICS],
            ] as const) {
                this.pushSamples(
                    type,
                    samplesByType[type]!,
                    timestampSec,
                    outlet,
                    log,
                    stream
                )
            }
        }
    }

    private static pushSamples(
        type: string,
        samples: number[][],
        t0: number,
        outlet: StreamOutlet | undefined,
        log?: (...data: any[]) => void,
        stream?: WriteStream
    ) {
        const rate = SAMPLES_RATES_HZ[type]!

        samples.forEach((sample, i) => {
            const ts = t0 + i / rate
            outlet?.pushSample(sample, ts)

            const msg = `${type.padEnd(13)} | ${ts.toFixed(5).padEnd(15)} | ${JSON.stringify(sample)}`
            stream?.write(`${msg}\n`)
            log?.(msg)
        })
    }

    private static parsePackets(payload: number[]) {
        const packets: { tag: number; data: number[]; valid: boolean }[] = []
        let offset = 0

        while (offset < payload.length) {
            if (offset + PACKET_HEADER_SIZE > payload.length) {
                break
            }

            const pktLen = payload[offset]!

            if (
                pktLen < PACKET_HEADER_SIZE ||
                offset + pktLen > payload.length
            ) {
                break
            }

            const tag = payload[offset + 9]!
            const data = payload.slice(
                offset + PACKET_HEADER_SIZE,
                offset + pktLen
            )

            packets.push({ tag, data, valid: SENSORS[tag] !== undefined })

            offset += pktLen
        }

        return packets
    }

    private static parseSubpackets(packet: {
        tag: number
        data: number[]
        valid: boolean
    }) {
        const subpackets: Subpacket[] = []
        const { data } = packet
        let offset = 0

        // First subpacket: raw sensor data (no TAG, no header), type = packet tag.
        const firstConfig = packet.valid ? SENSORS[packet.tag] : undefined
        if (firstConfig && offset + firstConfig.dataLen <= data.length) {
            subpackets.push({
                tag: packet.tag,
                dataBytes: data.slice(offset, offset + firstConfig.dataLen),
            })
            offset += firstConfig.dataLen
        }

        // Additional subpackets: [TAG][4-byte header][data].
        while (offset < data.length) {
            if (offset + SUBPACKET_HEADER_SIZE > data.length) {
                break
            }

            const tag = data[offset]!
            const config = SENSORS[tag]

            if (!config || config.dataLen === 0) {
                break
            }

            const start = offset + SUBPACKET_HEADER_SIZE
            const end = start + config.dataLen

            if (end > data.length) {
                break
            }

            subpackets.push({ tag, dataBytes: data.slice(start, end) })
            offset = end
        }

        return subpackets
    }

    private static decodeSubpacket(
        subpacket: Subpacket
    ): DecodedSubpacket | undefined {
        const config = SENSORS[subpacket.tag]

        if (!config) {
            return undefined
        }

        const { type, nChannels, nSamples } = config
        const { dataBytes } = subpacket

        const expected = EXPECTED_CHANNELS[type]
        if (expected !== undefined && expected !== nChannels) {
            return undefined
        }

        switch (type) {
            case 'EEG':
                return {
                    type: 'EEG',
                    samples: this.decodePacked(
                        dataBytes,
                        nChannels,
                        nSamples,
                        14,
                        EEG_SCALE
                    ),
                }
            case 'OPTICS':
                return {
                    type: 'OPTICS',
                    samples: this.decodePacked(
                        dataBytes,
                        nChannels,
                        nSamples,
                        20,
                        OPTICS_SCALE
                    ),
                }
            case 'IMU':
                return { type: 'IMU', samples: this.decodeImu(dataBytes) }
            default:
                return undefined
        }
    }

    private static decodePacked(
        dataBytes: number[],
        nChannels: number,
        nSamples: number,
        bitWidth: number,
        scale: number
    ) {
        const bits = this.bytesToBits(dataBytes)
        const samples: number[][] = []

        for (let s = 0; s < nSamples; s++) {
            const sample: number[] = []

            for (let c = 0; c < nChannels; c++) {
                const bitStart = (s * nChannels + c) * bitWidth
                const value = this.extractInt(bits, bitStart, bitWidth)
                sample.push(scale * value)
            }

            samples.push(sample)
        }

        return samples
    }

    private static decodeImu(dataBytes: number[]) {
        // One 0x47 subpacket holds 3 samples of [ACC_X,Y,Z, GYRO_X,Y,Z].
        const samples: number[][] = []

        for (let s = 0; s < 3; s++) {
            const sample: number[] = []

            for (let c = 0; c < 6; c++) {
                const value = this.readInt16LE(dataBytes, (s * 6 + c) * 2)
                const scale = c < 3 ? ACC_SCALE : GYRO_SCALE
                sample.push(scale * value)
            }

            samples.push(sample)
        }

        return samples
    }

    private static bytesToBits(bytes: number[]) {
        const bits: number[] = []

        for (const byte of bytes) {
            for (let b = 0; b < 8; b++) {
                bits.push((byte >> b) & 1)
            }
        }

        return bits
    }

    private static extractInt(bits: number[], start: number, width: number) {
        let value = 0

        for (let i = 0; i < width; i++) {
            if (bits[start + i]) {
                value |= 1 << i
            }
        }

        return value
    }

    private static readInt16LE(bytes: number[], offset: number) {
        const value = bytes[offset]! | (bytes[offset + 1]! << 8)
        return value >= 0x8000 ? value - 0x10000 : value
    }

    private static async EegOutlet(identifier: string) {
        return await LslStreamOutlet.Create({
            name: `Muse EEG (${identifier})`,
            type: 'EEG',
            channelNames: EEG_CHANNELS,
            sampleRateHz: SAMPLES_RATES_HZ.EEG!,
            channelFormat: 'float32',
            sourceId: `muse-eeg-${identifier}`,
            manufacturer: 'Interaxon Inc.',
            units: 'microvolt',
            chunkSize: 1,
        })
    }

    private static async ImuOutlet(identifier: string) {
        return await LslStreamOutlet.Create({
            name: `Muse IMU (${identifier})`,
            type: 'IMU',
            channelNames: IMU_CHANNELS,
            sampleRateHz: SAMPLES_RATES_HZ.IMU!,
            channelFormat: 'float32',
            sourceId: `muse-imu-${identifier}`,
            manufacturer: 'Interaxon Inc.',
            units: 'N/A',
            chunkSize: 1,
        })
    }

    private static async OpticsOutlet(identifier: string) {
        return await LslStreamOutlet.Create({
            name: `Muse Optics (${identifier})`,
            type: 'PPG',
            channelNames: OPTICS_CHANNELS,
            sampleRateHz: SAMPLES_RATES_HZ.OPTICS!,
            channelFormat: 'float32',
            sourceId: `muse-optics-${identifier}`,
            manufacturer: 'Interaxon Inc.',
            units: 'N/A',
            chunkSize: 1,
        })
    }
}

interface AthenaOutlets {
    EEG?: StreamOutlet
    IMU?: StreamOutlet
    OPTICS?: StreamOutlet
}

interface Subpacket {
    tag: number
    dataBytes: number[]
}

interface DecodedSubpacket {
    type: 'EEG' | 'IMU' | 'OPTICS'
    samples: number[][]
}

type SensorType = 'EEG' | 'IMU' | 'OPTICS' | 'BATTERY' | 'Unknown'

interface SensorConfig {
    type: SensorType
    nChannels: number
    nSamples: number
    rate: number
    dataLen: number
}
