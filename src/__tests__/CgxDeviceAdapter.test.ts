import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import CgxDeviceAdapter, { CgxAdapter } from '../components/CgxDeviceAdapter'

export default class CgxDeviceAdapterTest extends AbstractSpruceTest {
    private static instance: CgxAdapter

    protected static async beforeEach() {
        await super.beforeEach()
        this.instance = this.CgxDeviceAdapter()
    }

    @test()
    protected static async createsCgxDeviceAdapterInstance() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    private static CgxDeviceAdapter() {
        return CgxDeviceAdapter.Create()
    }
}
