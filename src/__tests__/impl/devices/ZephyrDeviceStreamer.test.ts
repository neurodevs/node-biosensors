import { test, assert } from '@neurodevs/node-tdd'

import { DeviceStreamer } from 'impl/BiosensorDeviceFactory.js'
import ZephyrDeviceStreamer from '../../../impl/devices/ZephyrDeviceStreamer.js'
import AbstractPackageTest from '../../AbstractPackageTest.js'

export default class ZephyrDeviceStreamerTest extends AbstractPackageTest {
    private static instance: DeviceStreamer

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.ZephyrDeviceStreamer()
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

    private static ZephyrDeviceStreamer() {
        return ZephyrDeviceStreamer.Create()
    }
}
