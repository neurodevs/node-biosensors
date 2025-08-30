import { test, assert } from '@sprucelabs/test-utils'
import BiosensorDeviceFactory from '../../modules/BiosensorDeviceFactory'
import { DeviceStreamer } from '../../types'
import AbstractBiosensorsTest from '../AbstractBiosensorsTest'

export default class BiosensorDeviceFactoryTest extends AbstractBiosensorsTest {
    private static adapter: DeviceStreamer

    protected static async beforeEach() {
        await super.beforeEach()

        this.adapter = this.CreateAdapter()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.adapter, 'Factory should create an adapter!')
    }

    private static CreateAdapter() {
        return BiosensorDeviceFactory.CreateDevices()
    }
}
