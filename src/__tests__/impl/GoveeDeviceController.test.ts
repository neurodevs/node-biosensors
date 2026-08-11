import { test, assert } from '@neurodevs/node-tdd'
import { FakeBleObserver } from '@neurodevs/node-lsl'

import GoveeDeviceController from '../../impl/govee/GoveeDeviceController.js'
import SpyGoveeController from '../../testDoubles/GoveeController/SpyGoveeController.js'
import AbstractDeviceControllerTest from '../AbstractDeviceControllerTest.js'

export default class GoveeDeviceControllerTest extends AbstractDeviceControllerTest {
    protected static instance: SpyGoveeController
    private static lastLog: string

    private static readonly advertisement = Buffer.from(
        '88ec00ee08f4176402',
        'hex'
    )
    private static readonly timestampSec = 2650540.252988708

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLog()

        GoveeDeviceController.Class = SpyGoveeController

        this.instance = await this.GoveeDeviceController()
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
    protected static async exposesUuidFromDeviceUuid() {
        assert.isEqual(
            this.instance.bleUuid,
            this.deviceId,
            'Did not expose the device uuid!'
        )
    }

    @test()
    protected static async exposesLslOutlets() {
        assert.isEqual(
            this.instance.outlets.length,
            0,
            'Did not expose outlets!'
        )
    }

    @test()
    protected static async createsBleObserverController() {
        const { deviceUuid } = FakeBleObserver.callsToConstructor[0] ?? {}

        assert.isEqualDeep(
            { deviceUuid },
            { deviceUuid: this.deviceId },
            'Did not create a BleObserverController with the device uuid!'
        )
    }

    @test()
    protected static async passesOnAdvertisementToBleObserver() {
        assert.isFunction(
            this.onAdvertisement,
            'Did not pass an onAdvertisement callback to the BleObserver!'
        )
    }

    @test()
    protected static async onAdvertisementLogsPacket() {
        this.onAdvertisement(
            this.advertisement,
            this.advertisement.length,
            this.timestampSec
        )

        assert.isEqual(
            this.lastLog,
            `[${this.timestampSec}] 88ec00ee08f4176402 ${this.advertisement.length}`,
            'Did not log the advertisement as expected!'
        )
    }

    @test()
    protected static async connectCallsStartObservingOnBleObserver() {
        await this.connect()

        assert.isEqual(
            FakeBleObserver.numCallsToStartObserving,
            1,
            'Did not call startObserving on the BleObserver!'
        )
    }

    @test()
    protected static async connectDoesNotStartObservingIfAlreadyConnected() {
        await this.connect()
        await this.connect()

        assert.isEqual(
            FakeBleObserver.numCallsToStartObserving,
            1,
            'Should not call startObserving if already connected!'
        )
    }

    @test()
    protected static async disconnectCallsStopObservingOnBleObserver() {
        await this.connect()
        await this.disconnect()

        assert.isEqual(
            FakeBleObserver.numCallsToStopObserving,
            1,
            'Did not call stopObserving on the BleObserver!'
        )
    }

    @test()
    protected static async disconnectDoesNotStopObservingIfNotConnected() {
        await this.disconnect()

        assert.isEqual(
            FakeBleObserver.numCallsToStopObserving,
            0,
            'Should not call stopObserving if not connected!'
        )
    }

    private static get onAdvertisement() {
        const { onAdvertisement } = FakeBleObserver.callsToConstructor[0] ?? {}
        return onAdvertisement!
    }

    private static setFakeLog() {
        GoveeDeviceController.log = {
            info: (msg: string) => {
                this.lastLog = msg
            },
        } as Console
    }

    private static async GoveeDeviceController() {
        const govee = await GoveeDeviceController.Create({
            deviceUuid: this.deviceId,
            xdfRecordPath: this.xdfRecordPath,
        })
        return govee as SpyGoveeController
    }
}
