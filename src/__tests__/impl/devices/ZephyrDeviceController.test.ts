import { test, assert } from '@neurodevs/node-tdd'

import ZephyrDeviceController from '../../../impl/devices/ZephyrDeviceController.js'
import { BleDeviceController, FakeBleController } from '@neurodevs/node-lsl'
import SpyZephyrController from '../../../testDoubles/devices/ZephyrController/SpyZephyrController.js'
import AbstractDeviceControllerTest from '../../AbstractDeviceControllerTest.js'

export default class ZephyrDeviceControllerTest extends AbstractDeviceControllerTest {
    protected static async beforeEach() {
        await super.beforeEach()

        BleDeviceController.Class = FakeBleController
        FakeBleController.resetTestDouble()

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
    protected static async disconnectCallsStopStreaming() {
        await this.assertDisconnectCallsStopStreaming()
    }

    @test()
    protected static async disconnectDoesNotCallStopStreamingIfNotStreaming() {
        await this.assertDisconnectDoesNotCallStopStreamingIfNotStreaming()
    }

    @test()
    protected static async createsBleControllerWithNamePrefixIfNoUuid() {
        assert.isEqualDeep(
            FakeBleController.callsToConstructor[0],
            {
                charCallbacks: [],
                deviceNamePrefix: 'BH BHT',
                deviceUuid: undefined,
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

    private static async ZephyrDeviceController() {
        const zephyr = await ZephyrDeviceController.Create()
        return zephyr as SpyZephyrController
    }
}
