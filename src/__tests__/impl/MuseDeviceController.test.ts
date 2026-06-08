import { randomInt } from 'node:crypto'

import { test, assert } from '@neurodevs/node-tdd'

import MuseDeviceController, {
    MUSE_CHAR_UUIDS,
    CONTROL_UUID,
    MuseControllerOptions,
} from '../../impl/MuseDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import {
    BleDeviceController,
    FakeBleController,
    FakeStreamOutlet,
    LslStreamOutlet,
} from '@neurodevs/node-lsl'
import SpyMuseController from '../../testDoubles/MuseController/SpyMuseController.js'

export default class MuseDeviceControllerTest extends AbstractPackageTest {
    private static instance: SpyMuseController

    private static readonly deviceUuid = this.generateId()
    private static readonly eegSampleRateHz = 256
    private static readonly eegChunkSize = 12

    private static readonly eegCharNames = [
        'EEG_TP9',
        'EEG_AF7',
        'EEG_AF8',
        'EEG_TP10',
        'EEG_AUX',
    ]

    private static readonly charCallbacks = Object.entries(MUSE_CHAR_UUIDS).map(
        ([name, uuid]) => {
            return {
                charUuid: uuid,
                charName: name,
                onData: (
                    _data: Buffer,
                    _length: number,
                    _timestamp: number
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

        BleDeviceController.Class = FakeBleController
        FakeBleController.resetTestDouble()

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

        LslStreamOutlet.Class = FakeStreamOutlet
        FakeStreamOutlet.resetTestDouble()

        MuseDeviceController.Class = SpyMuseController

        MuseDeviceController.log = (...args: unknown[]) => {
            this.logCalls.push(args)
        }

        this.logCalls.length = 0

        this.instance = await this.MuseDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async startsWithIsConnectedFalse() {
        assert.isFalse(this.isConnected, 'Did not set isConnected false!')
    }

    @test()
    protected static async startsWithIsStreamingFalse() {
        assert.isFalse(this.isStreaming, 'Did not set isStreaming false!')
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
    protected static async connectSetsIsConnectedTrue() {
        await this.connect()

        assert.isTrue(this.isConnected, 'Did not set isConnected true!')
    }

    @test()
    protected static async connectCallsBleControllerConnect() {
        await this.connect()

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            1,
            'Did not connect to BLE device!'
        )
    }

    @test()
    protected static async connectDoesNotCallBleControllerIfConnected() {
        await this.connect()
        await this.connect()

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            1,
            'Did not connect to BLE device!'
        )
    }

    @test()
    protected static async startStreamingSetsIsStreamingTrue() {
        await this.startStreaming()

        assert.isTrue(this.isStreaming, 'Did not set isStreaming true!')
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
    protected static async stopStreamingSetsIsStreamingFalse() {
        await this.startStreaming()
        await this.stopStreaming()

        assert.isFalse(this.isStreaming, 'Did not set isStreaming false!')
    }

    @test()
    protected static async stopStreamingWritesHaltCommandToControlChar() {
        await this.startStreaming()
        await this.stopStreaming()

        assert.isEqualDeep(
            FakeBleController.callsToWriteCharacteristic[0],
            this.generateCmd('h'),
            'Did not write halt command to control char!'
        )
    }

    @test()
    protected static async stopStreamingDoesNotWriteControlCharIfNotStreaming() {
        await this.stopStreaming()

        assert.isEqualDeep(
            FakeBleController.callsToWriteCharacteristic,
            [],
            'Should not have written to control char!'
        )
    }

    @test()
    protected static async disconnectSetsIsConnectedFalse() {
        await this.connect()
        await this.disconnect()

        assert.isFalse(this.isConnected, 'Did not set isConnected false!')
    }

    @test()
    protected static async disconnectCallsDisconnectBle() {
        await this.connect()
        await this.disconnect()

        assert.isEqual(
            FakeBleController.numCallsToDisconnect,
            1,
            'Did not disconnect from BLE device!'
        )
    }

    @test()
    protected static async disconnectCallsStopStreaming() {
        let wasHit = false

        this.instance.stopStreaming = async () => {
            wasHit = true
        }

        await this.startStreaming()
        await this.disconnect()

        assert.isTrue(wasHit, 'Should call stopStreaming on disconnect!')
    }

    @test()
    protected static async disconnectDoesNotCallStopStreamingIfNotStreaming() {
        let wasHit = false

        this.instance.stopStreaming = async () => {
            wasHit = true
        }

        await this.disconnect()

        assert.isFalse(
            wasHit,
            'Should not call stopStreaming if not streaming!'
        )
    }

    @test()
    protected static async disconnectDoesNotCallBleControllerIfNotConnected() {
        await this.disconnect()

        assert.isEqual(
            FakeBleController.numCallsToDisconnect,
            0,
            'Should not disconnect from BLE device if not connected!'
        )
    }

    @test()
    protected static async onDataDecodesAndLogsBytesToConsole() {
        const { timestamp, fakeBytes, name } = this.simulateOnData()

        assert.isEqualDeep(
            this.logCalls,
            [[`[${timestamp}] ${name} ${fakeBytes}`]],
            'Did not log expected data to console!'
        )
    }

    @test()
    protected static async doesNotLogIfPassedOption() {
        await this.MuseDeviceController({ enableLogs: false })

        this.simulateOnData()

        assert.isEqualDeep(
            this.logCalls,
            [],
            'Should not log any data to console!'
        )
    }

    @test()
    protected static async doesNotLogByDefault() {
        await MuseDeviceController.Create({ bleUuid: this.deviceUuid })

        this.simulateOnData()

        assert.isEqualDeep(
            this.logCalls,
            [],
            'Should not log any data to console by default!'
        )
    }

    @test()
    protected static async onDataCreatesWriteStreamWithOption() {
        await this.MuseDeviceController({
            txtRecordPath: this.txtRecordPath,
        })

        this.simulateOnData()

        assert.isEqualDeep(
            this.callsToCreateWriteStream[0],
            { path: this.txtRecordPath, options: { flags: 'a' } },
            'Did not create write stream with expected options!'
        )
    }

    @test()
    protected static async onDataWritesToWriteStreamWithExpectedContent() {
        await this.MuseDeviceController({
            txtRecordPath: this.txtRecordPath,
        })

        this.simulateOnData()

        assert.isEqualDeep(
            this.callsToWriteStream[0],
            `[12345] ${this.charCallbacks[0].charName} ${[10, 20, 30]}\n`,
            'Did not write expected content to write stream!'
        )
    }

    @test()
    protected static async onDataPushesEegSamplesToOutlet() {
        const { timestamp, charValues } = this.simulateEegOnData()

        const expected = Array.from(
            { length: this.eegChunkSize },
            (_, sampleIdx) => ({
                sample: charValues.map((values) => values[sampleIdx]),
                timestamp: timestamp + sampleIdx / this.eegSampleRateHz,
            })
        )

        assert.isEqualDeep(
            FakeStreamOutlet.callsToPushSample,
            expected,
            'Should push each EEG sample of chunk!'
        )
    }

    @test()
    protected static async onDataLogsEegSamplesOnceChunkIsFormed() {
        const { timestamp, charValues } = this.simulateEegOnData()

        const expected = this.generateExpectedEegMessages(
            timestamp,
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

        const { timestamp, charValues } = this.simulateEegOnData()

        const expected = this.generateExpectedEegMessages(
            timestamp,
            charValues
        ).map((msg) => `${msg}\n`)

        assert.isEqualDeep(
            this.eegWriteStreamCalls,
            expected,
            'Should write each EEG sample to the write stream once the chunk is formed!'
        )
    }

    @test()
    protected static async exposesUuidFromBleController() {
        await this.startStreaming()

        assert.isEqual(
            this.instance.bleUuid,
            this.deviceUuid,
            'Did not expose uuid from BLE controller!'
        )
    }

    @test()
    protected static async exposesNameFromBleController() {
        await this.startStreaming()

        assert.isEqual(
            this.instance.bleName,
            this.instance.getName(),
            'Did not expose name from BLE controller!'
        )
    }

    @test()
    protected static async passesRssiIntervalMsToBleController() {
        const rssiIntervalMs = randomInt(1, 5)

        await this.MuseDeviceController({ rssiIntervalMs })

        const call = FakeBleController.callsToConstructor[1]

        assert.isEqual(
            call?.rssiIntervalMs,
            rssiIntervalMs,
            'Did not pass rssiIntervalMs to BLE controller!'
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
            sourceId: 'muse-s-ppg',
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

    private static get isConnected() {
        return this.instance.getIsConnected()
    }

    private static get isStreaming() {
        return this.instance.getIsStreaming()
    }

    private static async connect() {
        await this.instance.connect()
    }

    private static async startStreaming() {
        await this.instance.startStreaming()
    }

    private static async stopStreaming() {
        await this.instance.stopStreaming()
    }

    private static async disconnect() {
        await this.instance.disconnect()
    }

    private static generateCmd(value: string) {
        return {
            characteristicUuid: CONTROL_UUID,
            value,
        }
    }

    private static simulateOnData() {
        const calls = FakeBleController.callsToConstructor
        const { charCallbacks } = calls[calls.length - 1]!
        const { onData, charName } = charCallbacks![0]!

        const fakeBytes = [10, 20, 30]
        const fakeBuffer = Buffer.from(fakeBytes)
        const timestamp = 12345

        onData(fakeBuffer, fakeBytes.length, timestamp)

        return { timestamp, fakeBytes, name: charName }
    }

    private static generateExpectedEegMessages(
        timestamp: number,
        charValues: number[][]
    ) {
        return Array.from({ length: this.eegChunkSize }, (_, sampleIdx) => {
            const sample = charValues.map((values) => values[sampleIdx])
            const ts = timestamp + sampleIdx / this.eegSampleRateHz

            return `EEG, ${JSON.stringify(sample)}, ${ts}`
        })
    }

    private static get eegLogCalls() {
        return this.logCalls.filter(([msg]) =>
            (msg as string).startsWith('EEG,')
        )
    }

    private static get eegWriteStreamCalls() {
        return this.callsToWriteStream.filter((chunk) =>
            (chunk as string).startsWith('EEG,')
        )
    }

    private static simulateEegOnData() {
        const calls = FakeBleController.callsToConstructor
        const { charCallbacks } = calls[calls.length - 1]!

        const timestamp = randomInt(1, 100)

        const charValues = this.eegCharNames.map(() =>
            this.generateEegCharValues()
        )

        this.eegCharNames.forEach((charName, charIdx) => {
            const { onData } = charCallbacks!.find(
                (callback) => callback.charName === charName
            )!

            const fakeBytes = this.generateEegBytes(charValues[charIdx])
            const fakeBuffer = Buffer.from(fakeBytes)

            onData(fakeBuffer, fakeBytes.length, timestamp)
        })

        return { timestamp, charValues }
    }

    private static generateEegCharValues() {
        return Array.from(
            { length: this.eegChunkSize },
            (_, sampleIdx) => sampleIdx
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
            enableLogs: true,
            ...options,
        })) as SpyMuseController
    }
}
