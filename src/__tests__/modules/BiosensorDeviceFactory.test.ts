import { test, assert } from '@sprucelabs/test-utils'
import BiosensorDeviceFactory, {
    DeviceFactory,
} from '../../modules/BiosensorDeviceFactory'
import AbstractBiosensorsTest from '../AbstractBiosensorsTest'

export default class BiosensorDeviceFactoryTest extends AbstractBiosensorsTest {
    private static instance: DeviceFactory

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.BiosensorDeviceFactory()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsDeviceForCgxDeviceStreamer() {
        const device = this.instance.createDevice('Cognionics Quick-20r')
        assert.isTruthy(device, 'Failed to create device!')
    }

    private static BiosensorDeviceFactory() {
        return BiosensorDeviceFactory.Create()
    }
}
