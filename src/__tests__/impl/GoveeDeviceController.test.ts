import { test, assert } from '@neurodevs/node-tdd'

import GoveeDeviceController, {
    GoveeController,
} from '../../impl/govee/GoveeDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class GoveeDeviceControllerTest extends AbstractPackageTest {
    private static instance: GoveeController

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.GoveeDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static GoveeDeviceController() {
        return GoveeDeviceController.Create()
    }
}
