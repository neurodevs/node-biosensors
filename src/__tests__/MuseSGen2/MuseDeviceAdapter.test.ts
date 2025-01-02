import { test, assert, generateId } from '@sprucelabs/test-utils'
import MuseDeviceAdapter, {
    MuseAdapter,
    MuseAdapterOptions,
} from '../../components/MuseSGen2/MuseDeviceAdapter'
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
        assert.isEqual(
            FakeMuseRecorder.numCallsToConstructor,
            1,
            'Should construct MuseStreamRecorder!'
        )
    }

    @test()
    protected static async doesNotConstructRecorderIfNoXdfRecordPath() {
        FakeMuseRecorder.resetTestDouble()
        this.MuseDeviceAdapter({ xdfRecordPath: undefined })

        assert.isEqual(
            FakeMuseRecorder.numCallsToConstructor,
            0,
            'Should not construct MuseStreamRecorder!'
        )
    }

    @test()
    protected static async startStreamingCallsStartOnRecorderIfEnabled() {
        this.startStreaming()

        assert.isEqual(
            FakeMuseRecorder.numCallsToStart,
            1,
            'Should call start on MuseStreamRecorder!'
        )
    }

    private static startStreaming() {
        this.instance.startStreaming()
    }

    private static MuseDeviceAdapter(options?: MuseAdapterOptions) {
        return MuseDeviceAdapter.Create({
            xdfRecordPath: generateId(),
            ...options,
        })
    }
}
