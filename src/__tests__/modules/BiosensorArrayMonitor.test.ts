import { test, assert } from '@sprucelabs/test-utils'
import BiosensorArrayMonitor, {
    ArrayMonitor,
} from '../../modules/BiosensorArrayMonitor'
import AbstractPackageTest from '../AbstractPackageTest'

export default class BiosensorArrayMonitorTest extends AbstractPackageTest {
    private static instance: ArrayMonitor

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.BiosensorArrayMonitor()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static BiosensorArrayMonitor() {
        return BiosensorArrayMonitor.Create()
    }
}
