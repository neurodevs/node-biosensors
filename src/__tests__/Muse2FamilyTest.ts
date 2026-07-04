import { randomInt } from 'node:crypto'

import { assert } from '@neurodevs/node-tdd'
import { FakeBleController, FakeStreamOutlet } from '@neurodevs/node-lsl'

import MuseDeviceController, {
    CONTROL_UUID,
    MuseControllerOptions,
    MuseDeviceModel,
} from '../impl/muse/MuseDeviceController.js'
import SpyMuseController from '../testDoubles/MuseController/SpyMuseController.js'
import AbstractDeviceControllerBleTest from './AbstractDeviceControllerBleTest.js'

// For "Muse 2" and "Muse S Gen 2" models
export default abstract class Muse2FamilyTest extends AbstractDeviceControllerBleTest {
    protected static instance: SpyMuseController

    protected static readonly model: MuseDeviceModel
    protected static readonly charUuids: Record<string, string>
    protected static readonly eegCharNames: string[]
    protected static readonly startPreset: string

    protected static readonly eegSampleRateHz = 256
    protected static readonly eegChunkSize = 12

    protected static readonly ppgSampleRateHz = 64
    protected static readonly ppgChunkSize = 6
    protected static readonly ppgCharNames = [
        'PPG_AMBIENT',
        'PPG_INFRARED',
        'PPG_RED',
    ]

    protected static readonly imuSampleRateHz = 52
    protected static readonly imuChunkSize = 3

    protected static readonly txtRecordPath = this.generateId()

    protected static readonly callsToCreateWriteStream: unknown[] = []
    protected static readonly callsToWriteStream: unknown[] = []
    protected static readonly logCalls: unknown[][] = []

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

    protected static async assertCreatesBleController() {
        const call = FakeBleController.callsToConstructor[0]

        const expectedCharCallbacks = Object.entries(this.charUuids).map(
            ([charName, charUuid]) => ({ charUuid, charName })
        )

        assert.isEqualDeep(
            {
                deviceUuid: call?.deviceUuid,
                charCallbacks: call?.charCallbacks?.map(
                    ({ charUuid, charName }) => ({ charUuid, charName })
                ),
            },
            {
                deviceUuid: this.deviceUuid,
                charCallbacks: expectedCharCallbacks,
            }
        )

        call?.charCallbacks?.forEach(({ onData }) => {
            assert.isFunction(onData, 'onData should be a function')
        })
    }

    protected static async assertStartStreamingWritesStartCommands() {
        await this.startStreaming()

        assert.isEqualDeep(
            FakeBleController.callsToWriteCharacteristic,
            this.expectedStartCommands,
            'Did not write the expected start commands to control char!'
        )
    }

    protected static async assertStartStreamingDoesNotWriteCharsIfStreaming() {
        await this.startStreaming()
        await this.startStreaming()

        assert.isEqualDeep(
            FakeBleController.callsToWriteCharacteristic,
            this.expectedStartCommands,
            'Should not write any commands to control char when already streaming!'
        )
    }

    protected static async assertPushesEegSamplesToOutlet() {
        const { charValues } = this.simulateEegOnData()

        const expected = Array.from(
            { length: this.eegChunkSize },
            (_, sampleIdx) => ({
                sample: charValues.map(
                    (values) => 0.48828125 * (values[sampleIdx] - 2048)
                ),
                timestampSec: this.fakeClockRegressorValue,
            })
        )

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should push each EEG sample of chunk!'
        )
    }

    protected static async assertScalesEegSamplesToMicrovolts() {
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

    protected static async assertLogsEegSamplesOnceChunkIsFormed() {
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

    protected static async assertWritesEegSamplesToWriteStreamOnceChunkIsFormed() {
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

    protected static async assertPushesPpgSamplesToOutlet() {
        const { charValues } = this.simulatePpgOnData()

        const expected = Array.from(
            { length: this.ppgChunkSize },
            (_, sampleIdx) => ({
                sample: charValues.map((values) => values[sampleIdx]),
                timestampSec: this.fakeClockRegressorValue,
            })
        )

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should push each PPG sample of chunk!'
        )
    }

    protected static async assertLogsPpgSamplesOnceChunkIsFormed() {
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

    protected static async assertWritesPpgSamplesToWriteStreamOnceChunkIsFormed() {
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

    protected static async assertPushesGyroSamplesToOutlet() {
        const samples = this.generateImuSamples()

        this.simulateImuOnDataWithSamples('GYROSCOPE', samples)

        const expected = samples.map((sample) => ({
            sample: sample.map((v) => 0.0074768 * v),
            timestampSec: this.fakeClockRegressorValue,
        }))

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should push each gyro sample from packet!'
        )
    }

    protected static async assertScalesGyroSamples() {
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

    protected static async assertLogsGyroSamplesOncePacketIsReceived() {
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

    protected static async assertWritesGyroSamplesToWriteStream() {
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

    protected static async assertPushesAccelSamplesToOutlet() {
        const samples = this.generateImuSamples()

        this.simulateImuOnDataWithSamples('ACCELEROMETER', samples)

        const expected = samples.map((sample) => ({
            sample: sample.map((v) => 0.0000610352 * v),
            timestampSec: this.fakeClockRegressorValue,
        }))

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should push each accel sample from packet!'
        )
    }

    protected static async assertScalesAccelSamples() {
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

    protected static async assertLogsAccelSamplesOncePacketIsReceived() {
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

    protected static async assertWritesAccelSamplesToWriteStream() {
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

    protected static async assertCreatesEegLslOutlet() {
        const firstCall = FakeStreamOutlet.callsToConstructor[0]

        assert.isEqualDeep(firstCall, {
            name: `Muse EEG (${this.shortUuid})`,
            type: 'EEG',
            channelNames: this.eegCharNames,
            sampleRateHz: this.eegSampleRateHz,
            channelFormat: 'float32',
            sourceId: `muse-eeg-${this.shortUuid}`,
            manufacturer: 'Interaxon Inc.',
            units: 'microvolt',
            chunkSize: 1,
        })
    }

    protected static async assertDoesNotCreateEegLslOutletWithFlag() {
        FakeStreamOutlet.callsToConstructor.length = 0

        await this.MuseDeviceController({ disableEeg: true })

        assert.isEqual(
            FakeStreamOutlet.callsToConstructor.filter(
                (call) => call?.name === `Muse EEG (${this.shortUuid})`
            ).length,
            0,
            'Should not create any EEG outlets!'
        )
    }

    protected static async assertCreatesPpgLslOutlet() {
        const secondCall = FakeStreamOutlet.callsToConstructor[1]

        assert.isEqualDeep(secondCall, {
            name: `Muse PPG (${this.shortUuid})`,
            type: 'PPG',
            channelNames: ['PPG_AMBIENT', 'PPG_INFRARED', 'PPG_RED'],
            sampleRateHz: 64,
            channelFormat: 'float32',
            sourceId: `muse-ppg-${this.shortUuid}`,
            manufacturer: 'Interaxon Inc.',
            units: 'N/A',
            chunkSize: 1,
        })
    }

    protected static async assertDoesNotCreatePpgLslOutletWithFlag() {
        FakeStreamOutlet.callsToConstructor.length = 0

        await this.MuseDeviceController({ disablePpg: true })

        assert.isEqual(
            FakeStreamOutlet.callsToConstructor.filter(
                (call) => call?.name === `Muse PPG (${this.shortUuid})`
            ).length,
            0,
            'Should not create any PPG outlets!'
        )
    }

    protected static async assertCreatesGyroscopeLslOutlet() {
        const call = FakeStreamOutlet.callsToConstructor[2]

        assert.isEqualDeep(call, {
            name: `Muse Gyroscope (${this.shortUuid})`,
            type: 'GYRO',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: this.imuSampleRateHz,
            channelFormat: 'float32',
            sourceId: `muse-gyroscope-${this.shortUuid}`,
            manufacturer: 'Interaxon Inc.',
            units: 'degrees/s',
            chunkSize: 1,
        })
    }

    protected static async assertDoesNotCreateGyroscopeLslOutletWithFlag() {
        FakeStreamOutlet.callsToConstructor.length = 0

        await this.MuseDeviceController({ disableGyro: true })

        assert.isEqual(
            FakeStreamOutlet.callsToConstructor.filter(
                (call) => call?.name === `Muse Gyroscope (${this.shortUuid})`
            ).length,
            0,
            'Should not create any Gyroscope outlets!'
        )
    }

    protected static async assertCreatesAccelerometerLslOutlet() {
        const call = FakeStreamOutlet.callsToConstructor[3]

        assert.isEqualDeep(call, {
            name: `Muse Accelerometer (${this.shortUuid})`,
            type: 'ACCEL',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: this.imuSampleRateHz,
            channelFormat: 'float32',
            sourceId: `muse-accelerometer-${this.shortUuid}`,
            manufacturer: 'Interaxon Inc.',
            units: 'g',
            chunkSize: 1,
        })
    }

    protected static async assertDoesNotCreateAccelerometerLslOutletWithFlag() {
        FakeStreamOutlet.callsToConstructor.length = 0

        await this.MuseDeviceController({ disableAccel: true })

        assert.isEqual(
            FakeStreamOutlet.callsToConstructor.filter(
                (call) =>
                    call?.name === `Muse Accelerometer (${this.shortUuid})`
            ).length,
            0,
            'Should not create any Accelerometer outlets!'
        )
    }

    protected static async assertCreatesEegClockRegressor() {
        this.assertConstructsClockRegressorWith(this.eegSampleRateHz)
    }

    protected static async assertCreatesPpgClockRegressor() {
        this.assertConstructsClockRegressorWith(this.ppgSampleRateHz)
    }

    protected static async assertCreatesGyroClockRegressor() {
        this.assertConstructsClockRegressorWith(this.imuSampleRateHz)
    }

    protected static async assertCreatesAccelClockRegressor() {
        this.assertConstructsClockRegressorWith(this.imuSampleRateHz)
    }

    protected static async assertCallsDeriveTimestampsOnEegRegressor() {
        const { timestampSec, packetCounter } = this.simulateEegOnData()

        this.assertDerivesTimestampsWith(
            (packetCounter * this.eegChunkSize) / this.eegSampleRateHz,
            timestampSec,
            this.eegChunkSize
        )
    }

    protected static async assertCallsDeriveTimestampsOnPpgRegressor() {
        const { timestampSec, packetCounter } = this.simulatePpgOnData()

        this.assertDerivesTimestampsWith(
            (packetCounter * this.ppgChunkSize) / this.ppgSampleRateHz,
            timestampSec,
            this.ppgChunkSize
        )
    }

    protected static async assertCallsDeriveTimestampsOnAccelRegressor() {
        const samples = this.generateImuSamples()

        const { timestampSec, packetCounter } =
            this.simulateImuOnDataWithSamples('ACCELEROMETER', samples)

        this.assertDerivesTimestampsWith(
            (packetCounter * this.imuChunkSize) / this.imuSampleRateHz,
            timestampSec,
            this.imuChunkSize
        )
    }

    protected static async assertCallsDeriveTimestampsOnGyroRegressor() {
        const samples = this.generateImuSamples()

        const { timestampSec, packetCounter } =
            this.simulateImuOnDataWithSamples('GYROSCOPE', samples)

        this.assertDerivesTimestampsWith(
            (packetCounter * this.imuChunkSize) / this.imuSampleRateHz,
            timestampSec,
            this.imuChunkSize
        )
    }

    protected static async assertDisableEegIgnoresAllEegData() {
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

    protected static async assertDisablePpgIgnoresAllPpgData() {
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

    protected static async assertDisableGyroIgnoresAllGyroData() {
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

    protected static async assertDisableAccelIgnoresAllAccelData() {
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

    protected static get expectedStartCommands() {
        return [
            this.generateCmd('h'),
            this.generateCmd(this.startPreset),
            this.generateCmd('s'),
            this.generateCmd('d'),
        ]
    }

    protected static generateCmd(value: string) {
        return {
            characteristicUuid: CONTROL_UUID,
            value,
        }
    }

    protected static generateExpectedOnDataMessage(
        name: string | undefined,
        timestampSec: number,
        fakeBytes: number[]
    ): unknown {
        return `${name?.padEnd(13)} | ${timestampSec.toFixed(5).padEnd(15)} | ${JSON.stringify(fakeBytes)}`
    }

    protected static generateExpectedEegMessages(
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

    protected static get eegLogCalls() {
        return this.logCalls.filter(([msg]) =>
            (msg as string).startsWith('EEG ')
        )
    }

    protected static get eegWriteStreamCalls() {
        return this.callsToWriteStream.filter((chunk) =>
            (chunk as string).startsWith('EEG ')
        )
    }

    protected static simulateEegOnData() {
        const charValues = this.eegCharNames.map(() =>
            this.generateEegCharValues()
        )

        const { timestampSec, packetCounter } =
            this.simulateEegOnDataWithValues(charValues)

        return { timestampSec, charValues, packetCounter }
    }

    protected static simulateEegOnDataWithValues(charValues: number[][]) {
        const calls = FakeBleController.callsToConstructor
        const { charCallbacks } = calls[calls.length - 1]!

        const timestampSec = randomInt(1, 100)
        let packetCounter = 0

        this.eegCharNames.forEach((charName, charIdx) => {
            const { onData } = charCallbacks!.find(
                (callback) => callback.charName === charName
            )!

            const fakeBytes = this.generateEegBytes(charValues[charIdx])
            const fakeBuffer = Buffer.from(fakeBytes)

            if (charIdx === 0) {
                packetCounter = this.readUInt16BE(fakeBytes, 0)
            }

            onData(fakeBuffer, fakeBytes.length, timestampSec)
        })

        return { timestampSec, packetCounter }
    }

    protected static readUInt16BE(bytes: number[], offset: number) {
        return (bytes[offset]! << 8) | bytes[offset + 1]!
    }

    protected static generateEegCharValues() {
        return Array.from(
            { length: this.eegChunkSize },
            (_, sampleIdx) => 1000 + sampleIdx * 100
        )
    }

    protected static generateEegBytes(values: number[]) {
        const bytes = [this.generateRandomByte(), this.generateRandomByte()]

        for (let i = 0; i < values.length; i += 2) {
            bytes.push(...this.encode12BitPair(values[i]!, values[i + 1]!))
        }

        return bytes
    }

    protected static generateRandomByte() {
        return randomInt(0, 255)
    }

    protected static simulatePpgOnData() {
        const calls = FakeBleController.callsToConstructor
        const { charCallbacks } = calls[calls.length - 1]!

        const timestampSec = randomInt(1, 100)
        let packetCounter = 0

        const charValues = this.ppgCharNames.map(() =>
            this.generatePpgCharValues()
        )

        this.ppgCharNames.forEach((charName, charIdx) => {
            const { onData } = charCallbacks!.find(
                (callback) => callback.charName === charName
            )!

            const fakeBytes = this.generatePpgBytes(charValues[charIdx]!)
            const fakeBuffer = Buffer.from(fakeBytes)

            if (charIdx === 0) {
                packetCounter = this.readUInt16BE(fakeBytes, 0)
            }

            onData(fakeBuffer, fakeBytes.length, timestampSec)
        })

        return { timestampSec, charValues, packetCounter }
    }

    protected static generatePpgCharValues() {
        return Array.from(
            { length: this.ppgChunkSize },
            (_, sampleIdx) => 1000000 + sampleIdx * 100000
        )
    }

    protected static generatePpgBytes(values: number[]) {
        const bytes = [this.generateRandomByte(), this.generateRandomByte()]

        for (const value of values) {
            bytes.push((value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff)
        }

        return bytes
    }

    protected static generateExpectedPpgMessages(
        timestampSec: number,
        charValues: number[][]
    ) {
        return Array.from({ length: this.ppgChunkSize }, (_, sampleIdx) => {
            const sample = charValues.map((values) => values[sampleIdx])
            const ts = timestampSec + sampleIdx / this.ppgSampleRateHz

            return `${'PPG'.padEnd(13)} | ${ts.toFixed(5).padEnd(15)} | ${JSON.stringify(sample)}`
        })
    }

    protected static get ppgLogCalls() {
        return this.logCalls.filter(([msg]) =>
            (msg as string).startsWith('PPG ')
        )
    }

    protected static get ppgWriteStreamCalls() {
        return this.callsToWriteStream.filter((chunk) =>
            (chunk as string).startsWith('PPG ')
        )
    }

    protected static simulateImuOnDataWithSamples(
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
        const packetCounter = this.readUInt16BE(fakeBytes, 0)

        onData(fakeBuffer, fakeBytes.length, timestampSec)

        return { timestampSec, fakeBytes, packetCounter }
    }

    protected static generateImuSamples(): [number, number, number][] {
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

    protected static generateImuBytes(samples: [number, number, number][]) {
        const bytes = [this.generateRandomByte(), this.generateRandomByte()]

        // Fortran order: all x, then all y, then all z
        for (let axis = 0; axis < 3; axis++) {
            for (const sample of samples) {
                bytes.push(...this.encodeInt16(sample[axis]!))
            }
        }

        return bytes
    }

    protected static encodeInt16(value: number): [number, number] {
        const buf = Buffer.alloc(2)
        buf.writeInt16BE(value)
        return [buf[0]!, buf[1]!]
    }

    protected static generateExpectedImuMessages(
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

    protected static get gyroLogCalls() {
        return this.logCalls.filter(([msg]) =>
            (msg as string).startsWith('GYROSCOPE ')
        )
    }

    protected static get accelLogCalls() {
        return this.logCalls.filter(([msg]) =>
            (msg as string).startsWith('ACCELEROMETER ')
        )
    }

    protected static get gyroWriteStreamCalls() {
        return this.callsToWriteStream.filter((chunk) =>
            (chunk as string).startsWith('GYROSCOPE ')
        )
    }

    protected static get accelWriteStreamCalls() {
        return this.callsToWriteStream.filter((chunk) =>
            (chunk as string).startsWith('ACCELEROMETER ')
        )
    }

    protected static encode12BitPair(first: number, second: number) {
        return [
            (first >> 4) & 0xff,
            ((first & 0x0f) << 4) | ((second >> 8) & 0x0f),
            second & 0xff,
        ]
    }

    protected static async MuseDeviceController(
        options?: Partial<MuseControllerOptions>
    ) {
        return (await MuseDeviceController.Create(this.model, {
            bleUuid: this.deviceUuid,
            xdfRecordPath: this.xdfRecordPath,
            rssiIntervalMs: this.rssiIntervalMs,
            enableLogs: true,
            ...options,
        })) as SpyMuseController
    }
}
