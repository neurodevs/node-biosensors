import { test, assert } from '@neurodevs/node-tdd'

import { DeviceController } from '../../../impl/BiosensorDeviceFactory.js'
import ZephyrDeviceController from '../../../impl/devices/ZephyrDeviceController.js'
import AbstractPackageTest from '../../AbstractPackageTest.js'
import { BleDeviceController, FakeBleController } from '@neurodevs/node-lsl'

export default class ZephyrDeviceControllerTest extends AbstractPackageTest {
    private static instance: DeviceController

    protected static async beforeEach() {
        await super.beforeEach()

        BleDeviceController.Class = FakeBleController
        FakeBleController.resetTestDouble()

        this.instance = await this.ZephyrDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
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
        return ZephyrDeviceController.Create()
    }
}
