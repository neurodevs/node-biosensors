import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import MuseDeviceAdapter, {
    MuseAdapter,
} from '../../components/MuseSGen2/MuseDeviceAdapter'

export default class MuseDeviceAdapterTest extends AbstractSpruceTest {
    private static instance: MuseAdapter

    protected static async beforeEach() {
        await super.beforeEach()
        this.instance = this.MuseDeviceAdapter()
    }

    @test()
    protected static async canCreateMuseDeviceAdapter() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    private static MuseDeviceAdapter() {
        return MuseDeviceAdapter.Create()
    }
}
