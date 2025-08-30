import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import ZephyrDeviceStreamer from '../../devices/ZephyrDeviceStreamer'
import { DeviceStreamer } from '../../types'

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

    private static ZephyrDeviceStreamer() {
        return ZephyrDeviceStreamer.Create()
    }
}
