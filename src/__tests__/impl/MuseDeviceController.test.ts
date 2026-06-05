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

    private static readonly logCalls: unknown[][] = []

    protected static async beforeEach() {
        await super.beforeEach()

        BleDeviceController.Class = FakeBleController
        FakeBleController.resetTestDouble()

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
    protected static async disconnectCallsDisconnectBle() {
        await this.instance.disconnect()

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
    protected static async exposesUuidFromBleController() {
        await this.startStreaming()

        assert.isEqual(
            this.instance.bleUuid,
            this.deviceUuid,
            'Did not expose uuid from BLE controller!'
        )
    }

    @test()
    protected static async onDataDecodesAndLogsBytesToConsole() {
        const { timestamp, fakeBytes, name } = this.simulateOnData()

        assert.isEqualDeep(
            this.logCalls,
            [[`[${timestamp}]`, name, fakeBytes]],
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
