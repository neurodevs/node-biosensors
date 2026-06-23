import { test, assert } from '@neurodevs/node-tdd'
import { FakeBleController } from '@neurodevs/node-lsl'

import MuseDeviceController, {
    CONTROL_UUID,
    MuseControllerOptions,
} from '../../../impl/devices/MuseDeviceController.js'
import SpyMuseController from '../../../testDoubles/devices/MuseController/SpyMuseController.js'
import AbstractDeviceControllerBleTest from '../../AbstractDeviceControllerBleTest.js'

export default class MuseDeviceControllerTest extends AbstractDeviceControllerBleTest {
    protected static instance: SpyMuseController

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
    protected static async createsInstance() {
        await this.assertCreatesInstance()
    }

    @test()
    protected static async startsWithIsConnectedFalse() {
        await this.assertStartsWithIsConnectedFalse()
    }

    @test()
    protected static async startsWithIsStreamingFalse() {
        await this.assertStartsWithIsStreamingFalse()
    }

    @test()
    protected static async connectSetsIsConnectedTrue() {
        await this.assertConnectSetsIsConnectedTrue()
    }

    @test()
    protected static async startStreamingSetsIsStreamingTrue() {
        await this.assertStartStreamingSetsIsStreamingTrue()
    }

    @test()
    protected static async stopStreamingSetsIsStreamingFalse() {
        await this.assertStopStreamingSetsIsStreamingFalse()
    }

    @test()
    protected static async disconnectSetsIsConnectedFalse() {
        await this.assertDisconnectSetsIsConnectedFalse()
    }

    @test()
    protected static async connectCallsBleControllerConnect() {
        await this.assertConnectCallsBleControllerConnect()
    }

    @test()
    protected static async connectDoesNotCallBleControllerIfConnected() {
        await this.assertConnectDoesNotCallBleControllerIfConnected()
    }

    @test()
    protected static async disconnectCallsStopStreaming() {
        await this.assertDisconnectCallsStopStreaming()
    }

    @test()
    protected static async disconnectDoesNotCallStopStreamingIfNotStreaming() {
        await this.assertDisconnectDoesNotCallStopStreamingIfNotStreaming()
    }

    @test()
    protected static async disconnectCallsDisconnectBle() {
        await this.assertDisconnectCallsDisconnectBle()
    }

    @test()
    protected static async disconnectDoesNotCallBleControllerIfNotConnected() {
        await this.assertDisconnectDoesNotCallBleControllerIfNotConnected()
    }

    @test()
    protected static async connectWarnsWithDeviceId() {
        await this.assertConnectWarnsWithDeviceId()
    }

    @test()
    protected static async startStreamingWarnsWithDeviceId() {
        await this.assertStartStreamingWarnsWithDeviceId()
    }

    @test()
    protected static async stopStreamingWarnsWithDeviceId() {
        await this.assertStopStreamingWarnsWithDeviceId()
    }

    @test()
    protected static async disconnectWarnsWithDeviceId() {
        await this.assertDisconnectWarnsWithDeviceId()
    }

    @test()
    protected static async createsXdfRecorderIfPassedPath() {
        await this.assertCreatesXdfRecorderIfPassedPath()
    }

    @test()
    protected static async connectStartsXdfRecorder() {
        await this.assertConnectStartsXdfRecorder()
    }

    @test()
    protected static async disconnectFinishesXdfRecorder() {
        await this.assertDisconnectFinishesXdfRecorder()
    }

    @test()
    protected static async passesRssiIntervalMsToBleController() {
        await this.assertPassesRssiIntervalMsToBleController()
    }

    @test()
    protected static async exposesUuidFromBleController() {
        await this.assertExposesUuidFromBleController()
    }

    @test()
    protected static async exposesNameFromBleController() {
        await this.assertExposesNameFromBleController()
    }

    @test()
    protected static async createsBleControllerWithNamePrefixIfNoUuid() {
        await MuseDeviceController.Create('Muse S Gen 2')

        const call = FakeBleController.callsToConstructor[1]

        assert.isEqualDeep(
            {
                deviceNamePrefix: call?.deviceNamePrefix,
                deviceUuid: call?.deviceUuid,
            },
            {
                deviceNamePrefix: 'Muse',
                deviceUuid: undefined,
            },
            'Should fall back to a Muse name prefix when no bleUuid is passed!'
        )
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
    protected static async onDataDecodesAndLogsBytesToConsole() {
        const { timestampSec, fakeBytes, name } = this.simulateOnData()

        assert.isEqualDeep(
            this.logCalls,
            [
                [
                    this.generateExpectedOnDataMessage(
                        name,
                        timestampSec,
                        fakeBytes
                    ),
                ],
            ],
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
        await MuseDeviceController.Create('Muse S Gen 2', {
            bleUuid: this.deviceUuid,
        })

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
            this.callsToCreateWriteStream,
            [{ path: this.txtRecordPath, options: { flags: 'a' } }],
            'Did not create write stream with expected options!'
        )
    }

    @test()
    protected static async onDataWritesStreamWithExpectedContent() {
        await this.MuseDeviceController({
            txtRecordPath: this.txtRecordPath,
        })

        const { name, timestampSec, fakeBytes } = this.simulateOnData()

        assert.isEqualDeep(
            this.callsToWriteStream,
            [
                `${this.generateExpectedOnDataMessage(name, timestampSec, fakeBytes)}\n`,
            ],
            'Did not write expected content to write stream!'
        )
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
        const timestampSec = 12345

        onData(fakeBuffer, fakeBytes.length, timestampSec)

        return { timestampSec, fakeBytes, name: charName }
    }

    private static generateExpectedOnDataMessage(
        name: string | undefined,
        timestampSec: number,
        fakeBytes: number[]
    ): unknown {
        return `${name?.padEnd(13)} | ${timestampSec.toFixed(5).padEnd(15)} | ${JSON.stringify(fakeBytes)}`
    }

    private static async MuseDeviceController(
        options?: Partial<MuseControllerOptions>
    ) {
        return (await MuseDeviceController.Create('Muse S Gen 2', {
            bleUuid: this.deviceUuid,
            xdfRecordPath: this.xdfRecordPath,
            rssiIntervalMs: this.rssiIntervalMs,
            enableLogs: true,
            ...options,
        })) as SpyMuseController
    }
}
