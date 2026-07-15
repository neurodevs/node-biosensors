import { test, assert } from '@neurodevs/node-tdd'

import CytonDeviceController from '../../impl/openbci/CytonDeviceController.js'
import AbstractDeviceControllerTest from '../AbstractDeviceControllerTest.js'
import SpyCytonController from '../../testDoubles/CytonController/SpyCytonController.js'
import { FakeUsbController, FakeStreamOutlet } from '@neurodevs/node-lsl'

export default class CytonDeviceControllerTest extends AbstractDeviceControllerTest {
    protected static instance: SpyCytonController

    private static readonly serialNumber = this.deviceId
    private static readonly fakeStartTimeoutMs = 10
    private static readonly fakeRetryIntervalMs = 2

    protected static async beforeAll() {
        await super.beforeAll()

        assert.isEqual(
            CytonDeviceController.startTimeoutMs,
            5000,
            'Did not set expected value for startTimeoutMs!'
        )

        assert.isEqual(
            CytonDeviceController.retryIntervalMs,
            100,
            'Did not set expected value for retryIntervalMs!'
        )
    }

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeUsbController()

        CytonDeviceController.Class = SpyCytonController

        CytonDeviceController.startTimeoutMs = this.fakeStartTimeoutMs
        CytonDeviceController.retryIntervalMs = this.fakeRetryIntervalMs

        this.instance = await this.CytonDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
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
    protected static async disconnectCallsStopStreaming() {
        await this.assertDisconnectCallsStopStreaming()
    }

    @test()
    protected static async disconnectDoesNotCallStopStreamingIfNotStreaming() {
        await this.assertDisconnectDoesNotCallStopStreamingIfNotStreaming()
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
    protected static async createsUsbController() {
        assert.isEqualDeep(FakeUsbController.callsToConstructor[0], {
            onData: this.instance.getOnData(),
            serialNumber: this.serialNumber,
        })
    }

    @test()
    protected static async callsConnectOnUsbController() {
        await this.connect()

        assert.isEqual(
            FakeUsbController.numCallsToConnect,
            1,
            'Did not call connect!'
        )
    }

    @test()
    protected static async retriesStartCommandUntilTimeoutIfNoDataReceived() {
        await this.startStreaming()

        const expectedRetries =
            this.fakeStartTimeoutMs / this.fakeRetryIntervalMs

        assert.isEqual(
            FakeUsbController.callsToWriteUsb.filter((v) => v === 'b').length,
            expectedRetries,
            'Should retry writing the start command every retry interval until the timeout elapses!'
        )
    }

    @test()
    protected static async stopsRetryingOnceDataIsReceived() {
        const startPromise = this.instance.startStreaming()

        this.instance.getOnData()(Buffer.from([]), 0, 0)

        await startPromise

        const maxAttempts = this.fakeStartTimeoutMs / this.fakeRetryIntervalMs

        assert.isBetween(
            FakeUsbController.callsToWriteUsb.filter((v) => v === 'b').length,
            0,
            maxAttempts,
            'Should stop retrying the start command once data has been received!'
        )
    }

    @test()
    protected static async callsWriteUsbToStartStreaming() {
        await this.startStreaming()

        assert.isEqualDeep(FakeUsbController.callsToWriteUsb[0], 'b')
    }

    @test()
    protected static async callsWriteUsbToStopStreaming() {
        await this.startStreaming()
        await this.stopStreaming()

        const calls = FakeUsbController.callsToWriteUsb
        assert.isEqualDeep(calls[calls.length - 1], 's')
    }

    @test()
    protected static async disconnectsUsbController() {
        await this.connect()
        await this.disconnect()

        assert.isEqual(
            FakeUsbController.numCallsToDisconnect,
            1,
            'Did not call disconnect!'
        )
    }

    @test()
    protected static async createsExgLslOutlet() {
        assert.isEqualDeep(FakeStreamOutlet.callsToConstructor[0], {
            name: `Cyton ExG (${this.serialNumber})`,
            type: 'ExG',
            channelNames: [
                'CH1',
                'CH2',
                'CH3',
                'CH4',
                'CH5',
                'CH6',
                'CH7',
                'CH8',
            ],
            sampleRateHz: 250,
            channelFormat: 'float32',
            sourceId: `cyton-exg-${this.serialNumber}`,
            manufacturer: 'OpenBCI',
            units: 'microvolt',
            chunkSize: 1,
        })
    }

    @test()
    protected static async createsAccelLslOutlet() {
        assert.isEqualDeep(FakeStreamOutlet.callsToConstructor[1], {
            name: `Cyton Accelerometer (${this.serialNumber})`,
            type: 'ACCEL',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: 25,
            channelFormat: 'float32',
            sourceId: `cyton-accelerometer-${this.serialNumber}`,
            manufacturer: 'OpenBCI',
            units: 'g',
            chunkSize: 1,
        })
    }

    private static async CytonDeviceController() {
        return (await CytonDeviceController.Create({
            serialNumber: this.serialNumber,
            xdfRecordPath: this.xdfRecordPath,
        })) as SpyCytonController
    }
}
