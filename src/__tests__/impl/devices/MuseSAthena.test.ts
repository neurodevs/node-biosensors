import { randomInt } from 'node:crypto'

import { test, assert } from '@neurodevs/node-tdd'
import { FakeBleController, FakeStreamOutlet } from '@neurodevs/node-lsl'

import MuseDeviceController, {
    CONTROL_UUID,
    MuseControllerOptions,
} from '../../../impl/devices/MuseDeviceController.js'
import SpyMuseController from '../../../testDoubles/devices/MuseController/SpyMuseController.js'
import AbstractDeviceControllerBleTest from '../../AbstractDeviceControllerBleTest.js'

const EEG_UUID = '273E0013-4C4D-454D-96BE-F03BAC821358'
const OTHER_UUID = '273E0014-4C4D-454D-96BE-F03BAC821358'

const EEG_SCALE = 1450 / 16383
const OPTICS_SCALE = 1 / 32768
const ACC_SCALE = 0.0000610352
const GYRO_SCALE = -0.0074768

const EEG_HZ = 256
const IMU_HZ = 52
const OPTICS_HZ = 64

const TAG_EEG4 = 0x11
const TAG_EEG8 = 0x12
const TAG_OPTICS16 = 0x36
const TAG_ACCGYRO = 0x47
const TAG_UNKNOWN = 0x53

const PACKET_HEADER_SIZE = 14

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

const IMU_CHANNELS = ['ACC_X', 'ACC_Y', 'ACC_Z', 'GYRO_X', 'GYRO_Y', 'GYRO_Z']

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

export default class MuseSAthenaTest extends AbstractDeviceControllerBleTest {
    protected static instance: SpyMuseController

    private static readonly expectedCharCallbacks = [
        { charUuid: CONTROL_UUID, charName: 'CONTROL' },
        { charUuid: EEG_UUID, charName: 'EEG' },
        { charUuid: OTHER_UUID, charName: 'OTHER' },
    ]

    protected static async beforeEach() {
        await super.beforeEach()

        MuseDeviceController.Class = SpyMuseController
        MuseDeviceController.log = () => {}

        this.instance = await this.MuseDeviceController()
    }

    @test()
    protected static async createsBleDeviceControllerWithThreeDataCharacteristics() {
        const call = FakeBleController.callsToConstructor[0]

        assert.isEqualDeep(
            {
                deviceUuid: call?.deviceUuid,
                charCallbacks: call?.charCallbacks?.map(
                    ({ charUuid, charName }) => ({ charUuid, charName })
                ),
            },
            {
                deviceUuid: this.deviceUuid,
                charCallbacks: this.expectedCharCallbacks,
            },
            'Athena should subscribe to CONTROL + the two data characteristics only!'
        )

        call?.charCallbacks?.forEach(({ onData }) => {
            assert.isFunction(onData, 'onData should be a function')
        })
    }

    @test()
    protected static async startStreamingWritesAthenaCommandsToControlChar() {
        await this.startStreaming()

        assert.isEqualDeep(
            FakeBleController.callsToWriteCharacteristic,
            [
                this.generateCmd('v6'),
                this.generateCmd('s'),
                this.generateCmd('h'),
                this.generateCmd('p1041'),
                this.generateCmd('dc001'),
                this.generateCmd('dc001'),
                this.generateCmd('L1'),
            ],
            'Should write the Athena handshake/preset/start commands!'
        )
    }

    @test()
    protected static async createsEegOutlet() {
        assert.isEqualDeep(this.outletByName('Muse EEG'), {
            name: 'Muse EEG',
            type: 'EEG',
            channelNames: EEG_CHANNELS,
            sampleRateHz: EEG_HZ,
            channelFormat: 'float32',
            sourceId: 'muse-eeg',
            manufacturer: 'Interaxon Inc.',
            units: 'microvolt',
            chunkSize: 1,
        })
    }

    @test()
    protected static async createsImuOutlet() {
        assert.isEqualDeep(this.outletByName('Muse IMU'), {
            name: 'Muse IMU',
            type: 'IMU',
            channelNames: IMU_CHANNELS,
            sampleRateHz: IMU_HZ,
            channelFormat: 'float32',
            sourceId: 'muse-imu',
            manufacturer: 'Interaxon Inc.',
            units: 'N/A',
            chunkSize: 1,
        })
    }

    @test()
    protected static async createsOpticsOutlet() {
        assert.isEqualDeep(this.outletByName('Muse Optics'), {
            name: 'Muse Optics',
            type: 'PPG',
            channelNames: OPTICS_CHANNELS,
            sampleRateHz: OPTICS_HZ,
            channelFormat: 'float32',
            sourceId: 'muse-optics',
            manufacturer: 'Interaxon Inc.',
            units: 'N/A',
            chunkSize: 1,
        })
    }

    @test()
    protected static async decodesEegPacketAndPushesScaledSamples() {
        const samples = [
            [100, 200, 300, 400, 500, 600, 700, 800],
            [150, 250, 350, 450, 550, 650, 750, 850],
        ]

        const ts = this.simulateData('EEG', this.eegPacket(samples))

        const expected = samples.map((sample, i) => ({
            sample: sample.map((v) => EEG_SCALE * v),
            timestampSec: ts + i / EEG_HZ,
        }))

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should decode 14-bit EEG into scaled microvolt samples!'
        )
    }

    @test()
    protected static async decodesImuWithAccAndNegativeGyroScales() {
        const samples = [
            [10, 20, 30, 40, 50, 60],
            [11, 21, 31, 41, 51, 61],
            [12, 22, 32, 42, 52, 62],
        ]

        const ts = this.simulateData('OTHER', this.imuPacket(samples))

        const expected = samples.map((sample, i) => ({
            sample: [
                ACC_SCALE * sample[0],
                ACC_SCALE * sample[1],
                ACC_SCALE * sample[2],
                GYRO_SCALE * sample[3],
                GYRO_SCALE * sample[4],
                GYRO_SCALE * sample[5],
            ],
            timestampSec: ts + i / IMU_HZ,
        }))

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should scale accel positive and gyro negative in one IMU stream!'
        )
    }

    @test()
    protected static async decodesOpticsWith20BitScale() {
        const sample = Array.from({ length: 16 }, (_, i) => 1000 + i * 1000)

        const ts = this.simulateData('OTHER', this.opticsPacket([sample]))

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            [
                {
                    sample: sample.map((v) => OPTICS_SCALE * v),
                    timestampSec: ts,
                },
            ],
            'Should decode 20-bit optics into scaled samples!'
        )
    }

    @test()
    protected static async parsesMultiplePacketsInSingleMessage() {
        const first = [
            [10, 20, 30, 40, 50, 60],
            [11, 21, 31, 41, 51, 61],
            [12, 22, 32, 42, 52, 62],
        ]
        const second = [
            [13, 23, 33, 43, 53, 63],
            [14, 24, 34, 44, 54, 64],
            [15, 25, 35, 45, 55, 65],
        ]

        const message = [
            ...this.imuPacket(first),
            ...this.imuPacket(second),
        ]

        const ts = this.simulateData('OTHER', message)

        const allSamples = [...first, ...second]
        const expected = allSamples.map((sample, i) => ({
            sample: [
                ACC_SCALE * sample[0],
                ACC_SCALE * sample[1],
                ACC_SCALE * sample[2],
                GYRO_SCALE * sample[3],
                GYRO_SCALE * sample[4],
                GYRO_SCALE * sample[5],
            ],
            timestampSec: ts + i / IMU_HZ,
        }))

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should decode every packet in a multi-packet message!'
        )
    }

    @test()
    protected static async ignoresPacketWithMismatchedChannelCount() {
        // EEG4 (0x11) carries 4 channels, but our EEG outlet is 8 — pushing a
        // 4-wide sample into an 8-wide outlet corrupts the XDF, so skip it.
        const samples = [
            [100, 200, 300, 400],
            [150, 250, 350, 450],
            [120, 220, 320, 420],
            [170, 270, 370, 470],
        ]

        this.simulateData(
            'EEG',
            this.packet(TAG_EEG4, this.pack(samples.flat(), 14))
        )

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            [],
            'Should skip packets whose channel count does not match the outlet!'
        )
    }

    @test()
    protected static async ignoresUnknownSensorTag() {
        this.simulateData(
            'OTHER',
            this.packet(TAG_UNKNOWN, new Array(24).fill(0))
        )

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            [],
            'Should not push samples for an unknown sensor tag!'
        )
    }

    private static generateCmd(value: string) {
        return {
            characteristicUuid: CONTROL_UUID,
            value,
        }
    }

    private static outletByName(name: string) {
        return FakeStreamOutlet.callsToConstructor.find(
            (call) => call?.name === name
        )
    }

    private static simulateData(charName: 'EEG' | 'OTHER', bytes: number[]) {
        const calls = FakeBleController.callsToConstructor
        const { charCallbacks } = calls[calls.length - 1]!
        const { onData } = charCallbacks!.find(
            (cb) => cb.charName === charName
        )!

        const timestampSec = randomInt(1, 100)
        const buffer = Buffer.from(bytes)

        onData(buffer, bytes.length, timestampSec)

        return timestampSec
    }

    private static eegPacket(samples: number[][]) {
        return this.packet(TAG_EEG8, this.pack(samples.flat(), 14))
    }

    private static opticsPacket(samples: number[][]) {
        return this.packet(TAG_OPTICS16, this.pack(samples.flat(), 20))
    }

    private static imuPacket(samples: number[][]) {
        return this.packet(TAG_ACCGYRO, this.packInt16LE(samples.flat()))
    }

    private static packet(pktId: number, data: number[]) {
        const pktLen = PACKET_HEADER_SIZE + data.length

        const header = [
            pktLen,
            0, // pkt_index
            0,
            0,
            0,
            0, // pkt_time_raw (uint32 LE)
            0,
            0,
            0, // unknown1
            pktId,
            0,
            0,
            0, // unknown2
            0, // byte_13
        ]

        return [...header, ...data]
    }

    private static pack(values: number[], bitWidth: number) {
        const bits: number[] = []

        for (const value of values) {
            for (let b = 0; b < bitWidth; b++) {
                bits.push((value >>> b) & 1)
            }
        }

        const bytes: number[] = []

        for (let i = 0; i < bits.length; i += 8) {
            let byte = 0
            for (let b = 0; b < 8 && i + b < bits.length; b++) {
                if (bits[i + b]) {
                    byte |= 1 << b
                }
            }
            bytes.push(byte)
        }

        return bytes
    }

    private static packInt16LE(values: number[]) {
        const bytes: number[] = []

        for (const value of values) {
            const unsigned = value < 0 ? value + 0x10000 : value
            bytes.push(unsigned & 0xff, (unsigned >> 8) & 0xff)
        }

        return bytes
    }

    private static async MuseDeviceController(
        options?: Partial<MuseControllerOptions>
    ) {
        return (await MuseDeviceController.Create('Muse S Athena', {
            bleUuid: this.deviceUuid,
            xdfRecordPath: this.xdfRecordPath,
            rssiIntervalMs: this.rssiIntervalMs,
            ...options,
        })) as SpyMuseController
    }
}
