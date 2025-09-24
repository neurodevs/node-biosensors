import { test, assert } from '@sprucelabs/test-utils'
import BiosensorStreamViewer, {
    StreamViewer,
} from '../../modules/BiosensorStreamViewer'
import AbstractPackageTest from '../AbstractPackageTest'

export default class BiosensorStreamViewerTest extends AbstractPackageTest {
    private static instance: StreamViewer

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.BiosensorStreamViewer()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static BiosensorStreamViewer() {
        return BiosensorStreamViewer.Create()
    }
}
