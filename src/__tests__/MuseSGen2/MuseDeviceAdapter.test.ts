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
        await this.startStreaming()

        assert.isEqual(
            FakeMuseRecorder.numCallsToStart,
            1,
            'Should call start on MuseStreamRecorder!'
        )
    }

    @test()
    protected static async startStreamingCallsStartLslStreamsOnProducer() {
        await this.startStreaming()

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
    protected static async stopStreamingCallsStopLslStreamsOnProducer() {
        await this.stopStreaming()

        assert.isEqual(
            FakeMuseProducer.numCallsToStopLslStreams,
            1,
            'Should call stopLslStreams on MuseStreamProducer!'
        )
    }

    @test()
    protected static async passesOptionalRssiIntervalMsToProducer() {
        FakeMuseProducer.resetTestDouble()

        const rssiIntervalMs = 10
        await this.MuseDeviceAdapter({ rssiIntervalMs })

        assert.isEqual(
            FakeMuseProducer.callsToConstructor[0]?.rssiIntervalMs,
            rssiIntervalMs,
            'Should pass rssiIntervalMs to MuseStreamProducer!'
        )
    }

    @test()
    protected static async disconnectCallsStopLslStreamsOnProducer() {
        await this.disconnect()

        assert.isEqual(
            FakeMuseProducer.numCallsToStopLslStreams,
            1,
            'Should call producer.stopLslStreams() on disconnect!'
        )
    }

    @test()
    protected static async disconnectCallsDisconnectBleOnProducer() {
        await this.disconnect()

        assert.isEqual(
            FakeMuseProducer.numCallsToDisconnectBle,
            1,
            'Should call producer.disconnect() on disconnect!'
        )
    }

    @test()
    protected static async disconnectCallsStopOnXdfRecorder() {
        await this.disconnect()

        assert.isEqual(
            FakeMuseRecorder.numCallsToStop,
            1,
            'Should call recorder.stop() on disconnect!'
        )
    }

    @test()
    protected static async doesNotStartRecorderIfAlreadyStarted() {
        await this.startStreaming()
        await this.startStreaming()

        assert.isEqual(
            FakeMuseRecorder.numCallsToStart,
            1,
            'Should only call start on MuseStreamRecorder once!'
        )
    }

    private static async startStreaming() {
        await this.instance.startStreaming()
    }

    private static async stopStreaming() {
        await this.instance.stopStreaming()
    }

    private static async disconnect() {
        await this.instance.disconnect()
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
