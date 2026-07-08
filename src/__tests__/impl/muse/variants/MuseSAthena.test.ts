import { randomInt } from 'node:crypto'

import { test, assert } from '@neurodevs/node-tdd'
import { FakeBleController, FakeStreamOutlet } from '@neurodevs/node-lsl'

import MuseDeviceController, {
    CONTROL_UUID,
    MuseControllerOptions,
} from '../../../../impl/muse/MuseDeviceController.js'
import SpyMuseController from '../../../../testDoubles/MuseController/SpyMuseController.js'
import AbstractDeviceControllerBleTest from '../../../AbstractDeviceControllerBleTest.js'

const EEG_UUID = '273E0013-4C4D-454D-96BE-F03BAC821358'
const OTHER_UUID = '273E0014-4C4D-454D-96BE-F03BAC821358'

const EEG_SCALE = 1450 / 16383
const OPTICS_SCALE = 1 / 32768
const ACC_SCALE = 0.0000610352
const GYRO_SCALE = -0.0074768

const EEG_HZ = 256
const IMU_HZ = 52
const OPTICS_HZ = 64

const DEVICE_CLOCK_HZ = 256000

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
        assert.isEqualDeep(this.outletByName(`Muse EEG (${this.shortUuid})`), {
            name: `Muse EEG (${this.shortUuid})`,
            type: 'EEG',
            channelNames: EEG_CHANNELS,
            sampleRateHz: EEG_HZ,
            channelFormat: 'float32',
            sourceId: `muse-eeg-${this.shortUuid}`,
            manufacturer: 'Interaxon Inc.',
            units: 'microvolt',
            chunkSize: 1,
        })
    }

    @test()
    protected static async createsImuOutlet() {
        assert.isEqualDeep(this.outletByName(`Muse IMU (${this.shortUuid})`), {
            name: `Muse IMU (${this.shortUuid})`,
            type: 'IMU',
            channelNames: IMU_CHANNELS,
            sampleRateHz: IMU_HZ,
            channelFormat: 'float32',
            sourceId: `muse-imu-${this.shortUuid}`,
            manufacturer: 'Interaxon Inc.',
            units: 'N/A',
            chunkSize: 1,
        })
    }

    @test()
    protected static async createsOpticsOutlet() {
        assert.isEqualDeep(
            this.outletByName(`Muse Optics (${this.shortUuid})`),
            {
                name: `Muse Optics (${this.shortUuid})`,
                type: 'PPG',
                channelNames: OPTICS_CHANNELS,
                sampleRateHz: OPTICS_HZ,
                channelFormat: 'float32',
                sourceId: `muse-optics-${this.shortUuid}`,
                manufacturer: 'Interaxon Inc.',
                units: 'N/A',
                chunkSize: 1,
            }
        )
    }

    @test()
    protected static async createsEegClockRegressor() {
        this.assertConstructsClockRegressorWith(EEG_HZ)
    }

    @test()
    protected static async createsImuClockRegressor() {
        this.assertConstructsClockRegressorWith(IMU_HZ)
    }

    @test()
    protected static async createsOpticsClockRegressor() {
        this.assertConstructsClockRegressorWith(OPTICS_HZ)
    }

    @test()
    protected static async onDataCallsEegClockRegressorDeriveTimestamps() {
        const samples = [
            [100, 200, 300, 400, 500, 600, 700, 800],
            [150, 250, 350, 450, 550, 650, 750, 850],
        ]
        const baseTick = randomInt(1, 1_000_000)

        this.simulateData('EEG', this.eegPacket(samples, baseTick))

        const elapsedSamples = 256
        const ticksPerSample = DEVICE_CLOCK_HZ / EEG_HZ
        const secondTick = baseTick + elapsedSamples * ticksPerSample

        const ts = this.simulateData('EEG', this.eegPacket(samples, secondTick))

        this.assertDerivesTimestampsWith(
            (elapsedSamples + samples.length - 1) / EEG_HZ,
            ts,
            samples.length
        )
    }

    @test()
    protected static async onDataDerivesMonotonicImuDeviceTimeDespiteDuplicateTick() {
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

        const tick = randomInt(1, 1_000_000)

        this.simulateData('OTHER', this.imuPacket(first, tick))
        const ts = this.simulateData('OTHER', this.imuPacket(second, tick))

        this.assertDerivesTimestampsWith(
            (first.length + second.length - 1) / IMU_HZ,
            ts,
            second.length
        )
    }

    @test()
    protected static async derivesUniformImuDeviceTimeAcrossVariableBatchSizes() {
        const a = [
            [10, 20, 30, 40, 50, 60],
            [11, 21, 31, 41, 51, 61],
            [12, 22, 32, 42, 52, 62],
        ]
        const b = [
            [13, 23, 33, 43, 53, 63],
            [14, 24, 34, 44, 54, 64],
            [15, 25, 35, 45, 55, 65],
        ]
        const c = [
            [16, 26, 36, 46, 56, 66],
            [17, 27, 37, 47, 57, 67],
            [18, 28, 38, 48, 58, 68],
        ]

        const tick = randomInt(1, 1_000_000)

        const ts1 = this.simulateData('OTHER', this.imuPacket(a, tick))
        const ts2 = this.simulateData('OTHER', [
            ...this.imuPacket(b, tick),
            ...this.imuPacket(c, tick),
        ])

        this.assertDerivesTimestampsWith(2 / IMU_HZ, ts1, 3)
        this.assertDerivesTimestampsWith(8 / IMU_HZ, ts2, 6)
    }

    @test()
    protected static async onDataCallsOpticsClockRegressorDeriveTimestamps() {
        const sample = Array.from({ length: 16 }, (_, i) => 1000 + i * 1000)
        const pktTimeRaw = randomInt(1, 1_000_000)

        const ts = this.simulateData(
            'OTHER',
            this.opticsPacket([sample], pktTimeRaw)
        )

        this.assertDerivesTimestampsWith(0, ts, 1)
    }

    @test()
    protected static async decodesEegPacketAndPushesScaledSamples() {
        const samples = [
            [100, 200, 300, 400, 500, 600, 700, 800],
            [150, 250, 350, 450, 550, 650, 750, 850],
        ]

        this.simulateData('EEG', this.eegPacket(samples))

        const expected = samples.map((sample) => ({
            sample: sample.map((v) => EEG_SCALE * v),
            timestampSec: this.fakeClockRegressorValue,
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

        this.simulateData('OTHER', this.imuPacket(samples))

        const expected = samples.map((sample) => ({
            sample: [
                ACC_SCALE * sample[0],
                ACC_SCALE * sample[1],
                ACC_SCALE * sample[2],
                GYRO_SCALE * sample[3],
                GYRO_SCALE * sample[4],
                GYRO_SCALE * sample[5],
            ],
            timestampSec: this.fakeClockRegressorValue,
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

        this.simulateData('OTHER', this.opticsPacket([sample]))

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            [
                {
                    sample: sample.map((v) => OPTICS_SCALE * v),
                    timestampSec: this.fakeClockRegressorValue,
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

        const firstPktTimeRaw = randomInt(1, 1_000_000)
        const secondPktTimeRaw = randomInt(1, 1_000_000)

        const message = [
            ...this.imuPacket(first, firstPktTimeRaw),
            ...this.imuPacket(second, secondPktTimeRaw),
        ]

        const ts = this.simulateData('OTHER', message)

        const allSamples = [...first, ...second]
        const expected = allSamples.map((sample) => ({
            sample: [
                ACC_SCALE * sample[0],
                ACC_SCALE * sample[1],
                ACC_SCALE * sample[2],
                GYRO_SCALE * sample[3],
                GYRO_SCALE * sample[4],
                GYRO_SCALE * sample[5],
            ],
            timestampSec: this.fakeClockRegressorValue,
        }))

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should decode every packet in a multi-packet message!'
        )

        this.assertDerivesTimestampsWith(
            (allSamples.length - 1) / IMU_HZ,
            ts,
            allSamples.length
        )
    }

    @test()
    protected static async ignoresPacketWithMismatchedChannelCount() {
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

    private static eegPacket(samples: number[][], pktTimeRaw = 0) {
        return this.packet(TAG_EEG8, this.pack(samples.flat(), 14), pktTimeRaw)
    }

    private static opticsPacket(samples: number[][], pktTimeRaw = 0) {
        return this.packet(
            TAG_OPTICS16,
            this.pack(samples.flat(), 20),
            pktTimeRaw
        )
    }

    private static imuPacket(samples: number[][], pktTimeRaw = 0) {
        return this.packet(
            TAG_ACCGYRO,
            this.packInt16LE(samples.flat()),
            pktTimeRaw
        )
    }

    private static packet(pktId: number, data: number[], pktTimeRaw = 0) {
        const pktLen = PACKET_HEADER_SIZE + data.length

        const header = [
            pktLen,
            0,
            ...this.packUInt32LE(pktTimeRaw),
            0,
            0,
            0,
            pktId,
            0,
            0,
            0,
            0,
        ]

        return [...header, ...data]
    }

    private static packUInt32LE(value: number) {
        return [
            value & 0xff,
            (value >>> 8) & 0xff,
            (value >>> 16) & 0xff,
            (value >>> 24) & 0xff,
        ]
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
        return (await MuseDeviceController.Create({
            model: 'Muse S Athena',
            bleUuid: this.deviceUuid,
            xdfRecordPath: this.xdfRecordPath,
            rssiIntervalMs: this.rssiIntervalMs,
            ...options,
        })) as SpyMuseController
    }
}
