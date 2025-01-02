import { test, assert, generateId } from '@sprucelabs/test-utils'
import MuseDeviceAdapter, {
    MuseAdapter,
    MuseAdapterOptions,
} from '../../components/MuseSGen2/MuseDeviceAdapter'
import FakeMuseProducer from '../../testDoubles/MuseProducer/FakeMuseProducer'
import FakeMuseRecorder from '../../testDoubles/MuseRecorder/FakeMuseRecorder'
import AbstractBiosensorsTest from '../AbstractBiosensorsTest'

export default class MuseDeviceAdapterTest extends AbstractBiosensorsTest {
    private static instance: MuseAdapter

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeMuseProducer()
        this.setFakeMuseRecorder()

        this.instance = await this.MuseDeviceAdapter()
    }

    @test()
    protected static async canCreateMuseDeviceAdapter() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    @test()
    protected static async constructsMuseStreamProducer() {
        assert.isEqual(
            FakeMuseProducer.callsToConstructor.length,
            1,
            'Should construct MuseStreamProducer!'
        )
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
        await this.MuseDeviceAdapter({ xdfRecordPath: undefined })

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

    @test()
    protected static async startStreamingCallsStartLslStreamsOnProducer() {
        this.startStreaming()

        assert.isEqual(
            FakeMuseProducer.numCallsToStartLslStreams,
            1,
            'Should call startLslStreams on MuseStreamProducer!'
        )
    }

    @test()
    protected static async passesOptionalBleUuidToProducerForSpeedOptimization() {
        assert.isEqual(
            FakeMuseProducer.callsToConstructor[0]?.bleUuid,
            this.bleUuid,
            'Should pass bleUuid to MuseStreamProducer!'
        )
    }

    @test()
    protected static async stopStreamingCallsStopOnRecorderIfEnabled() {
        this.startStreaming()
        this.stopStreaming()

        assert.isEqual(
            FakeMuseRecorder.numCallsToStop,
            1,
            'Should call stop on MuseStreamRecorder!'
        )
    }

    private static startStreaming() {
        this.instance.startStreaming()
    }

    private static stopStreaming() {
        this.instance.stopStreaming()
    }

    private static readonly bleUuid = generateId()

    private static async MuseDeviceAdapter(options?: MuseAdapterOptions) {
        return MuseDeviceAdapter.Create({
            bleUuid: this.bleUuid,
            xdfRecordPath: generateId(),
            ...options,
        })
    }
}
