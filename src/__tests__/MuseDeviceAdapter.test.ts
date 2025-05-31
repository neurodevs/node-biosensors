import { assert, test, generateId } from '@sprucelabs/test-utils'
import { FakeXdfRecorder } from '@neurodevs/node-xdf'
import RecordableDeviceAdapter from '../modules/RecordableDeviceAdapter'
import FakeMuseProducer from '../testDoubles/MuseProducer/FakeMuseProducer'
import { DeviceAdapter, DeviceAdapterOptions } from '../types'
import AbstractBiosensorsTest from './AbstractBiosensorsTest'

export default class RecordableDeviceAdapterTest extends AbstractBiosensorsTest {
    private static instance: DeviceAdapter

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeMuseProducer()

        this.instance = await this.RecordableDeviceAdapter()
    }

    @test()
    protected static async canCreateRecordableDeviceAdapter() {
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
    protected static async constructsXdfStreamRecorderIfPassedXdfRecordPath() {
        assert.isEqual(
            FakeXdfRecorder.callsToConstructor.length,
            1,
            'Should construct XdfStreamRecorder!'
        )
    }

    @test()
    protected static async doesNotConstructRecorderIfNoXdfRecordPath() {
        FakeXdfRecorder.resetTestDouble()
        await this.RecordableDeviceAdapter({ xdfRecordPath: undefined })

        assert.isEqual(
            FakeXdfRecorder.callsToConstructor.length,
            0,
            'Should not construct XdfStreamRecorder!'
        )
    }

    @test()
    protected static async startStreamingCallsStartOnRecorderIfEnabled() {
        await this.startStreaming()

        assert.isEqual(
            FakeXdfRecorder.numCallsToStart,
            1,
            'Should call start on XdfStreamRecorder!'
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
        await this.RecordableDeviceAdapter({ rssiIntervalMs })

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
    protected static async disconnectCallsStopOnXdfRecorder() {
        await this.disconnect()

        assert.isEqual(
            FakeXdfRecorder.numCallsToStop,
            1,
            'Should call recorder.stop() on disconnect!'
        )
    }

    @test()
    protected static async doesNotStartRecorderIfAlreadyStarted() {
        await this.startStreaming()
        await this.startStreaming()

        assert.isEqual(
            FakeXdfRecorder.numCallsToStart,
            1,
            'Should only call start on XdfStreamRecorder once!'
        )
    }

    @test()
    protected static async exposesBleUuidField() {
        assert.isEqual(
            this.instance.bleUuid,
            this.bleUuid,
            'Should expose bleUuid!'
        )
    }

    @test()
    protected static async exposesBleNameField() {
        assert.isTruthy(this.instance.bleName, 'Should expose bleName!')
    }

    @test()
    protected static async startStreamingSetsIsRunningTrue() {
        await this.startStreaming()
        assert.isTrue(this.instance.isRunning, 'Should be running!')
    }

    @test()
    protected static async stopStreamingSetsIsRunningFalse() {
        await this.startStreaming()
        await this.stopStreaming()

        assert.isFalse(this.instance.isRunning, 'Should not be running!')
    }

    @test()
    protected static async disconnectCallsDisconnectOnMuseProducer() {
        await this.disconnect()

        assert.isEqual(
            FakeMuseProducer.numCallsToDisconnect,
            1,
            'Should call producer.disconnect() on disconnect!'
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

    private static async RecordableDeviceAdapter(
        options?: DeviceAdapterOptions
    ) {
        return RecordableDeviceAdapter.Create({
            bleUuid: this.bleUuid,
            xdfRecordPath: generateId(),
            ...options,
        })
    }
}
