import { test, assert } from '@neurodevs/node-tdd'

import ZephyrDeviceController from '../../../impl/zephyr/ZephyrDeviceController.js'
import { FakeBleController } from '@neurodevs/node-lsl'
import SpyZephyrController from '../../../testDoubles/ZephyrController/SpyZephyrController.js'
import AbstractDeviceControllerBleTest from '../../AbstractDeviceControllerBleTest.js'
import { DeviceControllerBleOptions } from '../../../impl/BiosensorDeviceFactory.js'

export default class ZephyrDeviceControllerTest extends AbstractDeviceControllerBleTest {
    protected static async beforeEach() {
        await super.beforeEach()

        ZephyrDeviceController.Class = SpyZephyrController

        this.instance = await this.ZephyrDeviceController()
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
    protected static async createsBleDeviceControllerWithUuid() {
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
                charCallbacks: [],
            }
        )

        call?.charCallbacks?.forEach(({ onData }) => {
            assert.isFunction(onData, 'onData should be a function')
        })
    }

    @test()
    protected static async createsBleControllerWithNamePrefixIfNoUuid() {
        await this.ZephyrDeviceController({ bleUuid: undefined })

        assert.isEqualDeep(
            FakeBleController.callsToConstructor[1],
            {
                charCallbacks: [],
                deviceNamePrefix: 'BH BHT',
                deviceUuid: undefined,
                rssiIntervalMs: this.rssiIntervalMs,
            },
            'Should fall back to a Muse name prefix when no bleUuid is passed!'
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

    private static async ZephyrDeviceController(
        options?: DeviceControllerBleOptions
    ) {
        const zephyr = await ZephyrDeviceController.Create({
            bleUuid: this.deviceUuid,
            xdfRecordPath: this.xdfRecordPath,
            rssiIntervalMs: this.rssiIntervalMs,
            ...options,
        })
        return zephyr as SpyZephyrController
    }
}
