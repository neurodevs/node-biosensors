import { test, assert } from '@neurodevs/node-tdd'

import EmotibitDeviceController, {
    EmotibitController,
} from '../../impl/emotibit/EmotibitDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class EmotibitDeviceControllerTest extends AbstractPackageTest {
    private static instance: EmotibitController

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.EmotibitDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static EmotibitDeviceController() {
        return EmotibitDeviceController.Create()
    }
}
