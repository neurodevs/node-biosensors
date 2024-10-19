import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import CgxQuick20Adapter, { BiosensorAdapter } from '../../CgxQuick20Adapter'

export default class CgxQuick20AdapterTest extends AbstractSpruceTest {
    private static instance: BiosensorAdapter

    protected static async beforeEach() {
        await super.beforeEach()
        this.instance = this.CgxQuick20Adapter()
    }

    @test()
    protected static async canCreateCgxQuick20Adapter() {
        assert.isTruthy(this.instance)
    }

    private static CgxQuick20Adapter() {
        return CgxQuick20Adapter.Create()
    }
}
