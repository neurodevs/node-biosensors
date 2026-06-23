import { randomInt } from 'node:crypto'

import { test, assert } from '@neurodevs/node-tdd'
import { FakeBleController, FakeStreamOutlet } from '@neurodevs/node-lsl'

import MuseDeviceController, {
    CONTROL_UUID,
    MuseControllerOptions,
} from '../../../impl/devices/MuseDeviceController.js'
import { MUSE_CHAR_UUIDS } from '../../../impl/devices/MuseSGen2.js'
import SpyMuseController from '../../../testDoubles/devices/MuseController/SpyMuseController.js'
import AbstractDeviceControllerBleTest from '../../AbstractDeviceControllerBleTest.js'

export default class MuseSGen2Test extends AbstractDeviceControllerBleTest {
    protected static instance: SpyMuseController

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

    private static readonly charCallbacks = Object.entries(MUSE_CHAR_UUIDS).map(
        ([name, uuid]) => {
            return {
                charUuid: uuid,
                charName: name,
                onData: (
                    _data: Buffer,
                    _length: number,
                    _timestampSec: number
                ) => {},
            }
        }
    )

    private static readonly txtRecordPath = this.generateId()

    private static readonly callsToCreateWriteStream: unknown[] = []
    private static readonly callsToWriteStream: unknown[] = []
    private static readonly logCalls: unknown[][] = []

    protected static async beforeEach() {
        await super.beforeEach()

        MuseDeviceController.createWriteStream = (path: any, options?: any) => {
            this.callsToCreateWriteStream.push({ path, options })
            return {
                write: (chunk: any) => {
                    this.callsToWriteStream.push(chunk)
                },
            } as any
        }

        this.callsToCreateWriteStream.length = 0
        this.callsToWriteStream.length = 0

        MuseDeviceController.Class = SpyMuseController

        MuseDeviceController.log = (...args: unknown[]) => {
            this.logCalls.push(args)
        }

        this.logCalls.length = 0

        this.instance = await this.MuseDeviceController()
    }

    @test()
    protected static async createsBleDeviceController() {
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
                charCallbacks: this.charCallbacks.map(
                    ({ charUuid, charName }) => ({ charUuid, charName })
                ),
            }
        )

        call?.charCallbacks?.forEach(({ onData }) => {
            assert.isFunction(onData, 'onData should be a function')
        })
    }

    @test()
    protected static async startStreamingWritesCommandsToControlChar() {
        await this.startStreaming()

        assert.isEqualDeep(
            FakeBleController.callsToWriteCharacteristic,
            [
                this.generateCmd('h'),
                this.generateCmd('p50'),
                this.generateCmd('s'),
                this.generateCmd('d'),
            ],
            'Should not write any commands to control char when starting streaming!'
        )
    }

    @test()
    protected static async startStreamingDoesNotWriteCharsIfStreaming() {
        await this.startStreaming()
        await this.startStreaming()

        assert.isEqualDeep(
            FakeBleController.callsToWriteCharacteristic,
            [
                this.generateCmd('h'),
                this.generateCmd('p50'),
                this.generateCmd('s'),
                this.generateCmd('d'),
            ],
            'Should not write any commands to control char when starting streaming!'
        )
    }

    @test()
    protected static async onDataPushesEegSamplesToOutlet() {
        const { timestampSec, charValues } = this.simulateEegOnData()

        const expected = Array.from(
            { length: this.eegChunkSize },
            (_, sampleIdx) => ({
                sample: charValues.map(
                    (values) => 0.48828125 * (values[sampleIdx] - 2048)
                ),
                timestampSec: timestampSec + sampleIdx / this.eegSampleRateHz,
            })
        )

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should push each EEG sample of chunk!'
        )
    }

    @test()
    protected static async onDataScalesEegSamplesToMicrovolts() {
        const rawValue = 3048
        const expectedMicrovolts = 0.48828125 * (rawValue - 2048)

        const charValues = this.eegCharNames.map(() =>
            Array.from({ length: this.eegChunkSize }, () => rawValue)
        )

        this.simulateEegOnDataWithValues(charValues)

        const pushedValues = FakeStreamOutlet.callsToPushSample.map(
            ({ sample }) => sample[0]
        )

        assert.isEqualDeep(
            pushedValues,
            Array.from({ length: this.eegChunkSize }, () => expectedMicrovolts),
            'Should scale EEG samples to microvolts!'
        )
    }

    @test()
    protected static async onDataLogsEegSamplesOnceChunkIsFormed() {
        const { timestampSec, charValues } = this.simulateEegOnData()

        const expected = this.generateExpectedEegMessages(
            timestampSec,
            charValues
        ).map((msg) => [msg])

        assert.isEqualDeep(
            this.eegLogCalls,
            expected,
            'Should log each EEG sample once the chunk is formed!'
        )
    }

    @test()
    protected static async onDataWritesEegSamplesToWriteStreamOnceChunkIsFormed() {
        await this.MuseDeviceController({ txtRecordPath: this.txtRecordPath })

        const { timestampSec, charValues } = this.simulateEegOnData()

        const expected = this.generateExpectedEegMessages(
            timestampSec,
            charValues
        ).map((msg) => `${msg}\n`)

        assert.isEqualDeep(
            this.eegWriteStreamCalls,
            expected,
            'Should write each EEG sample to the write stream once the chunk is formed!'
        )
    }

    @test()
    protected static async onDataPushesPpgSamplesToOutlet() {
        const { timestampSec, charValues } = this.simulatePpgOnData()

        const expected = Array.from(
            { length: this.ppgChunkSize },
            (_, sampleIdx) => ({
                sample: charValues.map((values) => values[sampleIdx]),
                timestampSec: timestampSec + sampleIdx / this.ppgSampleRateHz,
            })
        )

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should push each PPG sample of chunk!'
        )
    }

    @test()
    protected static async onDataLogsPpgSamplesOnceChunkIsFormed() {
        const { timestampSec, charValues } = this.simulatePpgOnData()

        const expected = this.generateExpectedPpgMessages(
            timestampSec,
            charValues
        ).map((msg) => [msg])

        assert.isEqualDeep(
            this.ppgLogCalls,
            expected,
            'Should log each PPG sample once the chunk is formed!'
        )
    }

    @test()
    protected static async onDataWritesPpgSamplesToWriteStreamOnceChunkIsFormed() {
        await this.MuseDeviceController({ txtRecordPath: this.txtRecordPath })

        const { timestampSec, charValues } = this.simulatePpgOnData()

        const expected = this.generateExpectedPpgMessages(
            timestampSec,
            charValues
        ).map((msg) => `${msg}\n`)

        assert.isEqualDeep(
            this.ppgWriteStreamCalls,
            expected,
            'Should write each PPG sample to the write stream once the chunk is formed!'
        )
    }

    @test()
    protected static async onDataPushesGyroSamplesToOutlet() {
        const samples = this.generateImuSamples()

        const { timestampSec } = this.simulateImuOnDataWithSamples(
            'GYROSCOPE',
            samples
        )

        const expected = samples.map((sample, i) => ({
            sample: sample.map((v) => 0.0074768 * v),
            timestampSec: timestampSec + i / this.imuSampleRateHz,
        }))

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should push each gyro sample from packet!'
        )
    }

    @test()
    protected static async onDataScalesGyroSamples() {
        const rawValue = 1000
        const expectedScaled = 0.0074768 * rawValue

        const samples = Array.from(
            { length: this.imuChunkSize },
            () => [rawValue, rawValue, rawValue] as [number, number, number]
        )

        this.simulateImuOnDataWithSamples('GYROSCOPE', samples)

        const pushedValues = FakeStreamOutlet.callsToPushSample.map(
            ({ sample }) => sample[0]
        )

        assert.isEqualDeep(
            pushedValues,
            Array.from({ length: this.imuChunkSize }, () => expectedScaled),
            'Should scale gyro samples by 0.0074768!'
        )
    }

    @test()
    protected static async onDataLogsGyroSamplesOncePacketIsReceived() {
        const samples = this.generateImuSamples()

        const { timestampSec, fakeBytes } = this.simulateImuOnDataWithSamples(
            'GYROSCOPE',
            samples
        )

        const expected = [
            [
                this.generateExpectedOnDataMessage(
                    'GYROSCOPE',
                    timestampSec,
                    fakeBytes
                ),
            ],
            ...this.generateExpectedImuMessages(
                'GYROSCOPE',
                timestampSec,
                samples,
                0.0074768
            ).map((msg) => [msg]),
        ]

        assert.isEqualDeep(
            this.gyroLogCalls,
            expected,
            'Should log each gyro sample once packet is received!'
        )
    }

    @test()
    protected static async onDataWritesGyroSamplesToWriteStream() {
        await this.MuseDeviceController({ txtRecordPath: this.txtRecordPath })

        const samples = this.generateImuSamples()

        const { timestampSec, fakeBytes } = this.simulateImuOnDataWithSamples(
            'GYROSCOPE',
            samples
        )

        const expected = [
            `${this.generateExpectedOnDataMessage('GYROSCOPE', timestampSec, fakeBytes)}\n`,
            ...this.generateExpectedImuMessages(
                'GYROSCOPE',
                timestampSec,
                samples,
                0.0074768
            ).map((msg) => `${msg}\n`),
        ]

        assert.isEqualDeep(
            this.gyroWriteStreamCalls,
            expected,
            'Should write each gyro sample to write stream!'
        )
    }

    @test()
    protected static async onDataPushesAccelSamplesToOutlet() {
        const samples = this.generateImuSamples()

        const { timestampSec } = this.simulateImuOnDataWithSamples(
            'ACCELEROMETER',
            samples
        )

        const expected = samples.map((sample, i) => ({
            sample: sample.map((v) => 0.0000610352 * v),
            timestampSec: timestampSec + i / this.imuSampleRateHz,
        }))

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should push each accel sample from packet!'
        )
    }

    @test()
    protected static async onDataScalesAccelSamples() {
        const rawValue = 1000
        const expectedScaled = 0.0000610352 * rawValue

        const samples = Array.from(
            { length: this.imuChunkSize },
            () => [rawValue, rawValue, rawValue] as [number, number, number]
        )

        this.simulateImuOnDataWithSamples('ACCELEROMETER', samples)

        const pushedValues = FakeStreamOutlet.callsToPushSample.map(
            ({ sample }) => sample[0]
        )

        assert.isEqualDeep(
            pushedValues,
            Array.from({ length: this.imuChunkSize }, () => expectedScaled),
            'Should scale accel samples by 0.0000610352!'
        )
    }

    @test()
    protected static async onDataLogsAccelSamplesOncePacketIsReceived() {
        const samples = this.generateImuSamples()
        const { timestampSec, fakeBytes } = this.simulateImuOnDataWithSamples(
            'ACCELEROMETER',
            samples
        )

        const expected = [
            [
                this.generateExpectedOnDataMessage(
                    'ACCELEROMETER',
                    timestampSec,
                    fakeBytes
                ),
            ],
            ...this.generateExpectedImuMessages(
                'ACCELEROMETER',
                timestampSec,
                samples,
                0.0000610352
            ).map((msg) => [msg]),
        ]

        assert.isEqualDeep(
            this.accelLogCalls,
            expected,
            'Should log each accel sample once packet is received!'
        )
    }

    @test()
    protected static async onDataWritesAccelSamplesToWriteStream() {
        await this.MuseDeviceController({ txtRecordPath: this.txtRecordPath })

        const samples = this.generateImuSamples()
        const { timestampSec, fakeBytes } = this.simulateImuOnDataWithSamples(
            'ACCELEROMETER',
            samples
        )

        const expected = [
            `${this.generateExpectedOnDataMessage('ACCELEROMETER', timestampSec, fakeBytes)}\n`,
            ...this.generateExpectedImuMessages(
                'ACCELEROMETER',
                timestampSec,
                samples,
                0.0000610352
            ).map((msg) => `${msg}\n`),
        ]

        assert.isEqualDeep(
            this.accelWriteStreamCalls,
            expected,
            'Should write each accel sample to write stream!'
        )
    }

    @test()
    protected static async createsEegLslOutlet() {
        const firstCall = FakeStreamOutlet.callsToConstructor[0]

        assert.isEqualDeep(firstCall, {
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

    @test()
    protected static async doesNotCreateEegLslOutletWithFlag() {
        FakeStreamOutlet.callsToConstructor.length = 0

        await this.MuseDeviceController({ disableEeg: true })

        assert.isEqual(
            FakeStreamOutlet.callsToConstructor.filter(
                (call) => call?.name === 'Muse EEG'
            ).length,
            0,
            'Should not create any EEG outlets!'
        )
    }

    @test()
    protected static async createsPpgLslOutlet() {
        const secondCall = FakeStreamOutlet.callsToConstructor[1]

        assert.isEqualDeep(secondCall, {
            name: 'Muse PPG',
            type: 'PPG',
            channelNames: ['PPG_AMBIENT', 'PPG_INFRARED', 'PPG_RED'],
            sampleRateHz: 64,
            channelFormat: 'float32',
            sourceId: 'muse-ppg',
            manufacturer: 'Interaxon Inc.',
            units: 'N/A',
            chunkSize: 1,
        })
    }

    @test()
    protected static async doesNotCreatePpgLslOutletWithFlag() {
        FakeStreamOutlet.callsToConstructor.length = 0

        await this.MuseDeviceController({ disablePpg: true })

        assert.isEqual(
            FakeStreamOutlet.callsToConstructor.filter(
                (call) => call?.name === 'Muse PPG'
            ).length,
            0,
            'Should not create any PPG outlets!'
        )
    }

    @test()
    protected static async createsGyroscopeLslOutlet() {
        const call = FakeStreamOutlet.callsToConstructor[2]

        assert.isEqualDeep(call, {
            name: 'Muse Gyroscope',
            type: 'GYRO',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: this.imuSampleRateHz,
            channelFormat: 'float32',
            sourceId: 'muse-gyroscope',
            manufacturer: 'Interaxon Inc.',
            units: 'degrees/s',
            chunkSize: 1,
        })
    }

    @test()
    protected static async doesNotCreateGyroscopeLslOutletWithFlag() {
        FakeStreamOutlet.callsToConstructor.length = 0

        await this.MuseDeviceController({ disableGyro: true })

        assert.isEqual(
            FakeStreamOutlet.callsToConstructor.filter(
                (call) => call?.name === 'Muse Gyroscope'
            ).length,
            0,
            'Should not create any Gyroscope outlets!'
        )
    }

    @test()
    protected static async createsAccelerometerLslOutlet() {
        const call = FakeStreamOutlet.callsToConstructor[3]

        assert.isEqualDeep(call, {
            name: 'Muse Accelerometer',
            type: 'ACCEL',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: this.imuSampleRateHz,
            channelFormat: 'float32',
            sourceId: 'muse-accelerometer',
            manufacturer: 'Interaxon Inc.',
            units: 'g',
            chunkSize: 1,
        })
    }

    @test()
    protected static async doesNotCreateAccelerometerLslOutletWithFlag() {
        FakeStreamOutlet.callsToConstructor.length = 0

        await this.MuseDeviceController({ disableAccel: true })

        assert.isEqual(
            FakeStreamOutlet.callsToConstructor.filter(
                (call) => call?.name === 'Muse Accelerometer'
            ).length,
            0,
            'Should not create any Accelerometer outlets!'
        )
    }

    @test()
    protected static async disableEegIgnoresAllEegData() {
        await this.MuseDeviceController({
            enableLogs: true,
            txtRecordPath: this.txtRecordPath,
            disableEeg: true,
        })

        this.simulateEegOnData()

        const eegLogCalls = this.logCalls.filter(([msg]) =>
            (msg as string).startsWith('EEG')
        )
        const eegWriteCalls = this.callsToWriteStream.filter((chunk) =>
            (chunk as string).startsWith('EEG')
        )

        assert.isEqualDeep(eegLogCalls, [], 'Should not log any EEG data!')
        assert.isEqualDeep(
            eegWriteCalls,
            [],
            'Should not write any EEG data to stream!'
        )
        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            [],
            'Should not push any EEG samples to outlet!'
        )
    }

    @test()
    protected static async disablePpgIgnoresAllPpgData() {
        await this.MuseDeviceController({
            enableLogs: true,
            txtRecordPath: this.txtRecordPath,
            disablePpg: true,
        })

        this.simulatePpgOnData()

        const ppgLogCalls = this.logCalls.filter(([msg]) =>
            (msg as string).startsWith('PPG')
        )
        const ppgWriteCalls = this.callsToWriteStream.filter((chunk) =>
            (chunk as string).startsWith('PPG')
        )

        assert.isEqualDeep(ppgLogCalls, [], 'Should not log any PPG data!')
        assert.isEqualDeep(
            ppgWriteCalls,
            [],
            'Should not write any PPG data to stream!'
        )
        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            [],
            'Should not push any PPG samples to outlet!'
        )
    }

    @test()
    protected static async disableGyroIgnoresAllGyroData() {
        await this.MuseDeviceController({
            enableLogs: true,
            txtRecordPath: this.txtRecordPath,
            disableGyro: true,
        })

        const samples = this.generateImuSamples()
        this.simulateImuOnDataWithSamples('GYROSCOPE', samples)

        assert.isEqualDeep(
            this.gyroLogCalls,
            [],
            'Should not log any gyro data!'
        )
        assert.isEqualDeep(
            this.gyroWriteStreamCalls,
            [],
            'Should not write any gyro data to stream!'
        )
        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            [],
            'Should not push any gyro samples to outlet!'
        )
    }

    @test()
    protected static async disableAccelIgnoresAllAccelData() {
        await this.MuseDeviceController({
            enableLogs: true,
            txtRecordPath: this.txtRecordPath,
            disableAccel: true,
        })

        const samples = this.generateImuSamples()
        this.simulateImuOnDataWithSamples('ACCELEROMETER', samples)

        assert.isEqualDeep(
            this.accelLogCalls,
            [],
            'Should not log any accel data!'
        )
        assert.isEqualDeep(
            this.accelWriteStreamCalls,
            [],
            'Should not write any accel data to stream!'
        )
        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            [],
            'Should not push any accel samples to outlet!'
        )
    }

    private static generateCmd(value: string) {
        return {
            characteristicUuid: CONTROL_UUID,
            value,
        }
    }

    private static generateExpectedOnDataMessage(
        name: string | undefined,
        timestampSec: number,
        fakeBytes: number[]
    ): unknown {
        return `${name?.padEnd(13)} | ${timestampSec.toFixed(5).padEnd(15)} | ${JSON.stringify(fakeBytes)}`
    }

    private static generateExpectedEegMessages(
        timestampSec: number,
        charValues: number[][]
    ) {
        return Array.from({ length: this.eegChunkSize }, (_, sampleIdx) => {
            const sample = charValues.map(
                (values) => 0.48828125 * (values[sampleIdx] - 2048)
            )
            const ts = timestampSec + sampleIdx / this.eegSampleRateHz

            return `${'EEG'.padEnd(13)} | ${ts.toFixed(5).padEnd(15)} | ${JSON.stringify(sample)}`
        })
    }

    private static get eegLogCalls() {
        return this.logCalls.filter(([msg]) =>
            (msg as string).startsWith('EEG ')
        )
    }

    private static get eegWriteStreamCalls() {
        return this.callsToWriteStream.filter((chunk) =>
            (chunk as string).startsWith('EEG ')
        )
    }

    private static simulateEegOnData() {
        const charValues = this.eegCharNames.map(() =>
            this.generateEegCharValues()
        )

        const timestampSec = this.simulateEegOnDataWithValues(charValues)

        return { timestampSec, charValues }
    }

    private static simulateEegOnDataWithValues(charValues: number[][]) {
        const calls = FakeBleController.callsToConstructor
        const { charCallbacks } = calls[calls.length - 1]!

        const timestampSec = randomInt(1, 100)

        this.eegCharNames.forEach((charName, charIdx) => {
            const { onData } = charCallbacks!.find(
                (callback) => callback.charName === charName
            )!

            const fakeBytes = this.generateEegBytes(charValues[charIdx])
            const fakeBuffer = Buffer.from(fakeBytes)

            onData(fakeBuffer, fakeBytes.length, timestampSec)
        })

        return timestampSec
    }

    private static generateEegCharValues() {
        return Array.from(
            { length: this.eegChunkSize },
            (_, sampleIdx) => 1000 + sampleIdx * 100
        )
    }

    private static generateEegBytes(values: number[]) {
        const bytes = [this.generateRandomByte(), this.generateRandomByte()]

        for (let i = 0; i < values.length; i += 2) {
            bytes.push(...this.encode12BitPair(values[i]!, values[i + 1]!))
        }

        return bytes
    }

    private static generateRandomByte() {
        return randomInt(0, 255)
    }

    private static simulatePpgOnData() {
        const calls = FakeBleController.callsToConstructor
        const { charCallbacks } = calls[calls.length - 1]!

        const timestampSec = randomInt(1, 100)

        const charValues = this.ppgCharNames.map(() =>
            this.generatePpgCharValues()
        )

        this.ppgCharNames.forEach((charName, charIdx) => {
            const { onData } = charCallbacks!.find(
                (callback) => callback.charName === charName
            )!

            const fakeBytes = this.generatePpgBytes(charValues[charIdx]!)
            const fakeBuffer = Buffer.from(fakeBytes)

            onData(fakeBuffer, fakeBytes.length, timestampSec)
        })

        return { timestampSec, charValues }
    }

    private static generatePpgCharValues() {
        return Array.from(
            { length: this.ppgChunkSize },
            (_, sampleIdx) => 1000000 + sampleIdx * 100000
        )
    }

    private static generatePpgBytes(values: number[]) {
        const bytes = [this.generateRandomByte(), this.generateRandomByte()]

        for (const value of values) {
            bytes.push((value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff)
        }

        return bytes
    }

    private static generateExpectedPpgMessages(
        timestampSec: number,
        charValues: number[][]
    ) {
        return Array.from({ length: this.ppgChunkSize }, (_, sampleIdx) => {
            const sample = charValues.map((values) => values[sampleIdx])
            const ts = timestampSec + sampleIdx / this.ppgSampleRateHz

            return `${'PPG'.padEnd(13)} | ${ts.toFixed(5).padEnd(15)} | ${JSON.stringify(sample)}`
        })
    }

    private static get ppgLogCalls() {
        return this.logCalls.filter(([msg]) =>
            (msg as string).startsWith('PPG ')
        )
    }

    private static get ppgWriteStreamCalls() {
        return this.callsToWriteStream.filter((chunk) =>
            (chunk as string).startsWith('PPG ')
        )
    }

    private static simulateImuOnDataWithSamples(
        charName: 'GYROSCOPE' | 'ACCELEROMETER',
        samples: [number, number, number][]
    ) {
        const calls = FakeBleController.callsToConstructor
        const { charCallbacks } = calls[calls.length - 1]!
        const { onData } = charCallbacks!.find(
            (cb) => cb.charName === charName
        )!

        const timestampSec = randomInt(1, 100)
        const fakeBytes = this.generateImuBytes(samples)
        const fakeBuffer = Buffer.from(fakeBytes)

        onData(fakeBuffer, fakeBytes.length, timestampSec)

        return { timestampSec, fakeBytes }
    }

    private static generateImuSamples(): [number, number, number][] {
        return Array.from(
            { length: this.imuChunkSize },
            (_, i) =>
                [100 + i * 10, 200 + i * 10, 300 + i * 10] as [
                    number,
                    number,
                    number,
                ]
        )
    }

    private static generateImuBytes(samples: [number, number, number][]) {
        const bytes = [this.generateRandomByte(), this.generateRandomByte()]

        // Fortran order: all x, then all y, then all z
        for (let axis = 0; axis < 3; axis++) {
            for (const sample of samples) {
                bytes.push(...this.encodeInt16(sample[axis]!))
            }
        }

        return bytes
    }

    private static encodeInt16(value: number): [number, number] {
        const buf = Buffer.alloc(2)
        buf.writeInt16BE(value)
        return [buf[0]!, buf[1]!]
    }

    private static generateExpectedImuMessages(
        label: string,
        timestampSec: number,
        samples: [number, number, number][],
        scale: number
    ) {
        return samples.map((sample, i) => {
            const scaled = sample.map((v) => scale * v)
            const ts = timestampSec + i / this.imuSampleRateHz
            return `${label.padEnd(13)} | ${ts.toFixed(5).padEnd(15)} | ${JSON.stringify(scaled)}`
        })
    }

    private static get gyroLogCalls() {
        return this.logCalls.filter(([msg]) =>
            (msg as string).startsWith('GYROSCOPE ')
        )
    }

    private static get accelLogCalls() {
        return this.logCalls.filter(([msg]) =>
            (msg as string).startsWith('ACCELEROMETER ')
        )
    }

    private static get gyroWriteStreamCalls() {
        return this.callsToWriteStream.filter((chunk) =>
            (chunk as string).startsWith('GYROSCOPE ')
        )
    }

    private static get accelWriteStreamCalls() {
        return this.callsToWriteStream.filter((chunk) =>
            (chunk as string).startsWith('ACCELEROMETER ')
        )
    }

    private static encode12BitPair(first: number, second: number) {
        return [
            (first >> 4) & 0xff,
            ((first & 0x0f) << 4) | ((second >> 8) & 0x0f),
            second & 0xff,
        ]
    }

    private static async MuseDeviceController(
        options?: Partial<MuseControllerOptions>
    ) {
        return (await MuseDeviceController.Create({
            bleUuid: this.deviceUuid,
            xdfRecordPath: this.xdfRecordPath,
            rssiIntervalMs: this.rssiIntervalMs,
            enableLogs: true,
            ...options,
        })) as SpyMuseController
    }
}
