import { test, assert } from '@sprucelabs/test-utils'
import DeviceAdapterFactory from '../../modules/DeviceAdapterFactory'
import { DeviceAdapter } from '../../types'
import AbstractBiosensorsTest from '../AbstractBiosensorsTest'

export default class DeviceAdapterFactoryTest extends AbstractBiosensorsTest {
    private static adapter: DeviceAdapter

    protected static async beforeEach() {
        await super.beforeEach()

        this.adapter = this.CreateAdapter()
    }

    @test()
    protected static async createsDeviceAdapterFactoryInstance() {
        assert.isTruthy(this.adapter, 'Factory should create an adapter!')
    }

    private static CreateAdapter() {
        return DeviceAdapterFactory.CreateAdapter()
    }
}
