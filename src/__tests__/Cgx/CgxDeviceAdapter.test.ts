import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import CgxDeviceAdapter from '../../components/Cgx/CgxDeviceAdapter'
import { DeviceAdapter } from '../../types'

export default class CgxDeviceAdapterTest extends AbstractSpruceTest {
    private static instance: DeviceAdapter

    protected static async beforeEach() {
        await super.beforeEach()
        this.instance = await this.CgxDeviceAdapter()
    }

    @test()
    protected static async createsCgxDeviceAdapterInstance() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    private static async CgxDeviceAdapter() {
        return await CgxDeviceAdapter.Create()
    }
}
