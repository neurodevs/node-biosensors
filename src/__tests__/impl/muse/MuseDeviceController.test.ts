import { test, assert } from '@neurodevs/node-tdd'
import { FakeBleController, FakeStreamOutlet } from '@neurodevs/node-lsl'

import MuseDeviceController, {
    CONTROL_UUID,
    MuseControllerOptions,
} from '../../../impl/muse/MuseDeviceController.js'
import Muse2 from '../../../impl/muse/variants/Muse2.js'
import MuseSAthena from '../../../impl/muse/variants/MuseSAthena.js'
import MuseSGen2 from '../../../impl/muse/variants/MuseSGen2.js'
import SpyMuseController from '../../../testDoubles/MuseController/SpyMuseController.js'
import AbstractDeviceControllerBleTest from '../../AbstractDeviceControllerBleTest.js'

export default class MuseDeviceControllerTest extends AbstractDeviceControllerBleTest {
    protected static instance: SpyMuseController

    private static readonly txtRecordPath = this.generateId()

    private static readonly gen2ControlResponse =
        '{"ap":"headset","sp":"Letto_revX","tp":"consumer","hw":"01.3","bn":2,"fi":"None","fw":"2.2.5","bl":"1.0.2","pv":2,"rc":0}'

    private static readonly athenaControlResponse =
        '{"fw":"3.1.19","bn":1,"tp":"consumer","hw":"01.1","pv":4,"ap":"headset","sp":"Athena_RevE","hb":"Athena_RevF_NW","bl":"1.0.1","be":"1.5.1","rc":0}'

    private static readonly muse2ControlResponse =
        '{"ap":"headset","sp":"Blackcomb_revB","tp":"consumer","hw":"10.4","bn":2,"fw":"1.0.21","bl":"1.0.0","pv":1,"rc":0}'

    private static readonly callsToCreateWriteStream: unknown[] = []
    private static readonly callsToWriteStream: unknown[] = []
    private static readonly logCalls: unknown[][] = []

    private static readonly originalReadControlResponse =
        //@ts-ignore
        MuseDeviceController.readControlResponse

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

        MuseDeviceController.fallbackDeviceCounter = 1

        MuseDeviceController.controlDetectWindowMs = 5
        MuseDeviceController.controlDetectTimeoutMs = 200

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
        await MuseDeviceController.Create({ model: 'Muse S Gen 2' })

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
    protected static async assignsIncrementingFallbackWhenNoBleUuidProvided() {
        await MuseDeviceController.Create({ model: 'Muse S Gen 2' })
        await MuseDeviceController.Create({ model: 'Muse S Athena' })

        const eegNames = FakeStreamOutlet.callsToConstructor.filter((call) =>
            call?.name?.startsWith('Muse EEG')
        )

        assert.isEqualDeep(
            {
                firstName: eegNames[1]?.name,
                secondName: eegNames[2]?.name,
            },
            {
                firstName: 'Muse EEG (Device-1)',
                secondName: 'Muse EEG (Device-2)',
            },
            'Should start the fallback short id at 1 when no bleUuid is passed!'
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
        await MuseDeviceController.Create({
            model: 'Muse S Gen 2',
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

    @test()
    protected static async autoDetectsMuseSGen2FromControlResponse() {
        await this.assertAutoDetectsVariant(this.gen2ControlResponse, MuseSGen2)
    }

    @test()
    protected static async autoDetectsMuseSAthenaFromControlResponse() {
        await this.assertAutoDetectsVariant(
            this.athenaControlResponse,
            MuseSAthena
        )
    }

    @test()
    protected static async autoDetectsMuse2FromControlResponse() {
        await this.assertAutoDetectsVariant(this.muse2ControlResponse, Muse2)
    }

    @test()
    protected static async autoDetectThrowsOnUnknownControlResponse() {
        const codename = 'Nonexistent_revA'
        const response = `{"sp":"${codename}","rc":0}`

        this.fakeControlResponse(response)

        await assert.doesThrowAsync(
            async () => await this.autoDetect(),
            `Could not resolve Muse model from unknown CONTROL hardware codename "${codename}" (sp field)! Response: ${response}`
        )
    }

    @test()
    protected static async autoDetectConnectsBleAndSubscribesVariantChars() {
        this.fakeControlResponse(this.gen2ControlResponse)

        const instance = await this.autoDetect()

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            1,
            'Auto-detection should connect the BLE device once during Create!'
        )

        assert.isEqualDeep(
            FakeBleController.callsToSubscribeCharacteristics[0],
            instance.getVariant().charCallbacks,
            'Did not subscribe the detected variant characteristics!'
        )
    }

    @test()
    protected static async autoDetectDoesNotReconnectOnConnect() {
        this.fakeControlResponse(this.gen2ControlResponse)

        const instance = await this.autoDetect()
        await instance.connect()

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            1,
            'connect() should not reconnect a BLE already connected during detection!'
        )

        assert.isTrue(
            instance.getIsConnected(),
            'connect() should still mark the controller connected!'
        )
    }

    @test()
    protected static async passedModelSkipsDetection() {
        let didRead = false

        //@ts-ignore
        MuseDeviceController.readControlResponse = async () => {
            didRead = true
            return ''
        }

        const instance = (await MuseDeviceController.Create({
            model: 'Muse S Athena',
            bleUuid: this.deviceUuid,
        })) as SpyMuseController

        assert.isFalse(
            didRead,
            'Should not read the CONTROL characteristic when a model is passed!'
        )

        assert.isTrue(
            instance.getVariant() instanceof MuseSAthena,
            'Explicit options.model should still select the requested variant!'
        )

        assert.isEqual(
            FakeBleController.callsToSubscribeCharacteristics.length,
            0,
            'Passing a model should not use the detection subscribe flow!'
        )
    }

    @test()
    protected static async readControlResponseWritesV6AndReturnsReply() {
        const ble = await this.MuseDeviceController()

        const controlBuffer = { text: this.gen2ControlResponse }

        const response = await this.originalReadControlResponse(
            (ble as any).ble,
            controlBuffer
        )

        assert.isEqual(
            response,
            this.gen2ControlResponse,
            'Did not return the CONTROL reply!'
        )

        assert.isEqualDeep(
            FakeBleController.callsToWriteCharacteristic.find(
                (c) => c.value === 'v6'
            ),
            this.generateCmd('v6'),
            "Did not write the 'v6' identify command to the CONTROL char!"
        )
    }

    @test()
    protected static async readControlResponseResendsV6UntilReplyArrives() {
        const ble = await this.fakeBleForDetection()
        const controlBuffer = { text: '' }

        // Simulate a cold device (e.g. the Muse 2) that ignores the first
        // couple of commands and only replies to the third 'v6'.
        let v6Writes = 0
        ble.writeCharacteristic = async (_charUuid: string, value: string) => {
            if (value === 'v6') {
                v6Writes += 1
                if (v6Writes >= 3) {
                    controlBuffer.text = this.gen2ControlResponse
                }
            }
        }

        const response = await this.originalReadControlResponse(
            ble,
            controlBuffer
        )

        assert.isEqual(
            response,
            this.gen2ControlResponse,
            'Did not return the reply once it finally arrived!'
        )

        assert.isAbove(
            v6Writes,
            1,
            'Should re-send v6 when the device does not reply to the first attempt!'
        )
    }

    @test()
    protected static async readControlResponseGivesUpWhenDeviceNeverReplies() {
        MuseDeviceController.controlDetectTimeoutMs = 60

        const ble = await this.fakeBleForDetection()
        const controlBuffer = { text: '' }

        let v6Writes = 0
        ble.writeCharacteristic = async (_charUuid: string, value: string) => {
            if (value === 'v6') {
                v6Writes += 1
            }
        }

        const response = await this.originalReadControlResponse(
            ble,
            controlBuffer
        )

        assert.isEqual(
            response,
            '',
            'Should return an empty reply when the device never responds!'
        )

        assert.isAbove(
            v6Writes,
            1,
            'Should re-send v6 several times before giving up!'
        )
    }

    private static async fakeBleForDetection() {
        const instance = await this.MuseDeviceController()
        return (instance as any).ble as FakeBleController
    }

    private static async assertAutoDetectsVariant(
        controlResponse: string,
        Variant: Function
    ) {
        this.fakeControlResponse(controlResponse)

        const instance = await this.autoDetect()

        assert.isTrue(
            instance.getVariant() instanceof Variant,
            `Did not auto-detect ${Variant.name} from the CONTROL response!`
        )
    }

    private static fakeControlResponse(response: string) {
        //@ts-ignore
        MuseDeviceController.readControlResponse = async () => response
    }

    private static async autoDetect() {
        return (await MuseDeviceController.Create({
            bleUuid: this.deviceUuid,
        })) as SpyMuseController
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
        return (await MuseDeviceController.Create({
            model: 'Muse S Gen 2',
            bleUuid: this.deviceUuid,
            xdfRecordPath: this.xdfRecordPath,
            rssiIntervalMs: this.rssiIntervalMs,
            enableLogs: true,
            ...options,
        })) as SpyMuseController
    }
}
