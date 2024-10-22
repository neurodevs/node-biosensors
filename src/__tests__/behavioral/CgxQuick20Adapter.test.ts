import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import { BleScannerImpl, FakeBleScanner } from '@neurodevs/node-ble-scanner'
import CgxQuick20Adapter, { BiosensorAdapter } from '../../CgxQuick20Adapter'

export default class CgxQuick20AdapterTest extends AbstractSpruceTest {
    private static instance: BiosensorAdapter

    protected static async beforeEach() {
        await super.beforeEach()

        BleScannerImpl.Class = FakeBleScanner

        FakeBleScanner.resetTestDouble()

        this.instance = this.CgxQuick20Adapter()
    }

    @test()
    protected static async canCreateCgxQuick20Adapter() {
        assert.isTruthy(this.instance)
    }

    @test()
    protected static async createsBleScanner() {
        assert.isEqual(FakeBleScanner.numCallsToConstructor, 1)
    }

    private static async CgxQuick20Adapter() {
        return await CgxQuick20Adapter.Create()
    }
}
