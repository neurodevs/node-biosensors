import { test, assert, generateId } from '@sprucelabs/test-utils'
import MuseDeviceAdapter, {
    MuseAdapter,
    MuseAdapterOptions,
} from '../../components/MuseSGen2/MuseDeviceAdapter'
import MuseStreamRecorder from '../../components/MuseSGen2/MuseStreamRecorder'
import FakeMuseRecorder from '../../testDoubles/MuseRecorder/FakeMuseRecorder'
import AbstractBiosensorsTest from '../AbstractBiosensorsTest'

export default class MuseDeviceAdapterTest extends AbstractBiosensorsTest {
    private static instance: MuseAdapter

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeMuseRecorder()

        this.instance = this.MuseDeviceAdapter()
    }

    @test()
    protected static async canCreateMuseDeviceAdapter() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    @test()
    protected static async constructsMuseStreamRecorderIfPassedXdfRecordPath() {
        FakeMuseRecorder.resetTestDouble()

        this.MuseDeviceAdapter({
            xdfRecordPath: generateId(),
        })

        assert.isEqual(
            FakeMuseRecorder.callsToConstructor,
            1,
            'Should construct MuseStreamRecorder!'
        )
    }

    private static setFakeMuseRecorder() {
        MuseStreamRecorder.Class = FakeMuseRecorder
        FakeMuseRecorder.resetTestDouble()
    }

    private static MuseDeviceAdapter(options?: MuseAdapterOptions) {
        return MuseDeviceAdapter.Create(options)
    }
}
