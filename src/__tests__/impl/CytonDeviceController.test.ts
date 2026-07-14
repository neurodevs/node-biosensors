import { test, assert } from '@neurodevs/node-tdd'

import CytonDeviceController from '../../impl/openbci/CytonDeviceController.js'
import AbstractDeviceControllerTest from '../AbstractDeviceControllerTest.js'
import SpyCytonController from '../../testDoubles/CytonController/SpyCytonController.js'
import { FakeUsbController } from '@neurodevs/node-lsl'

export default class CytonDeviceControllerTest extends AbstractDeviceControllerTest {
    protected static instance: SpyCytonController

    private static readonly serialNumber = this.deviceId

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeUsbController()

        CytonDeviceController.Class = SpyCytonController

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
    protected static async callsWriteUsbToStartStreaming() {
        await this.startStreaming()

        assert.isEqualDeep(FakeUsbController.callsToWriteUsb[0], 'b')
    }

    @test()
    protected static async callsWriteUsbToStopStreaming() {
        await this.startStreaming()
        await this.stopStreaming()

        assert.isEqualDeep(FakeUsbController.callsToWriteUsb[1], 's')
    }

    private static async CytonDeviceController() {
        return (await CytonDeviceController.Create({
            serialNumber: this.serialNumber,
            xdfRecordPath: this.xdfRecordPath,
        })) as SpyCytonController
    }
}
