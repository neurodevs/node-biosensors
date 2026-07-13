import { test, assert } from '@neurodevs/node-tdd'

import CytonDeviceController, {
    CytonController,
} from '../../impl/openbci/CytonDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class CytonDeviceControllerTest extends AbstractPackageTest {
    private static instance: CytonController

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.CytonDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static CytonDeviceController() {
        return CytonDeviceController.Create()
    }
}
