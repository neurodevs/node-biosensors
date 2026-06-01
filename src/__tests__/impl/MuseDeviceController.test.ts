import { test, assert } from '@neurodevs/node-tdd'

import MuseDeviceController, {
    DeviceController,
} from '../../impl/MuseDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class MuseDeviceControllerTest extends AbstractPackageTest {
    private static instance: DeviceController

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.MuseDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static MuseDeviceController() {
        return MuseDeviceController.Create()
    }
}
