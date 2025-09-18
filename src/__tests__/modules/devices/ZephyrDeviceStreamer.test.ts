import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import ZephyrDeviceStreamer from '../../../modules/devices/ZephyrDeviceStreamer'
import { DeviceStreamer } from '../../../types'

export default class ZephyrDeviceStreamerTest extends AbstractSpruceTest {
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
