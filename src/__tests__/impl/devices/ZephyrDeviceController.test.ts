import { test, assert } from '@neurodevs/node-tdd'

import { DeviceController } from '../../../impl/BiosensorDeviceFactory.js'
import ZephyrDeviceController from '../../../impl/devices/ZephyrDeviceController.js'
import AbstractPackageTest from '../../AbstractPackageTest.js'

export default class ZephyrDeviceControllerTest extends AbstractPackageTest {
    private static instance: DeviceController

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = await this.ZephyrDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
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
