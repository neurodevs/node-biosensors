import { assert, test, generateId } from '@sprucelabs/test-utils'
import { FakeXdfRecorder } from '@neurodevs/node-xdf'
import RecordableDeviceAdapter from '../modules/RecordableDeviceAdapter'
import FakeDeviceStreamer from '../testDoubles/FakeDeviceStreamer'
import { DeviceAdapter, DeviceAdapterOptions } from '../types'
import AbstractBiosensorsTest from './AbstractBiosensorsTest'

export default class RecordableDeviceAdapterTest extends AbstractBiosensorsTest {
    private static instance: DeviceAdapter

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeDeviceStreamer()

        this.instance = await this.RecordableDeviceAdapter()
    }

    @test()
    protected static async canCreateRecordableDeviceAdapter() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    @test()
    protected static async constructsMuseDeviceStreamer() {
        assert.isEqual(
            FakeDeviceStreamer.callsToConstructor.length,
            1,
            'Should construct MuseDeviceStreamer!'
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
    protected static async startStreamingCallsStartStreamingOnStreamer() {
        await this.startStreaming()

        assert.isEqual(
            FakeDeviceStreamer.numCallsToStartStreaming,
            1,
            'Should call startLslStreams on MuseDeviceStreamer!'
        )
    }

    @test()
    protected static async passesOptionalBleUuidToStreamerForSpeedOptimization() {
        assert.isEqual(
            FakeDeviceStreamer.callsToConstructor[0]?.bleUuid,
            this.bleUuid,
            'Should pass bleUuid to MuseDeviceStreamer!'
        )
    }

    @test()
    protected static async stopStreamingCallsStopStreamingOnStreamer() {
        await this.stopStreaming()

        assert.isEqual(
            FakeDeviceStreamer.numCallsToStopStreaming,
            1,
            'Should call stopStreaming on MuseDeviceStreamer!'
        )
    }

    @test()
    protected static async passesOptionalRssiIntervalMsToStreamer() {
        FakeDeviceStreamer.resetTestDouble()

        const rssiIntervalMs = 10
        await this.RecordableDeviceAdapter({ rssiIntervalMs })

        assert.isEqual(
            FakeDeviceStreamer.callsToConstructor[0]?.rssiIntervalMs,
            rssiIntervalMs,
            'Should pass rssiIntervalMs to MuseDeviceStreamer!'
        )
    }

    @test()
    protected static async disconnectCallsStopStreamingOnStreamer() {
        await this.disconnect()

        assert.isEqual(
            FakeDeviceStreamer.numCallsToStopStreaming,
            1,
            'Should call streamer.stopStreaming() on disconnect!'
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
    protected static async disconnectCallsDisconnectOnStreamer() {
        await this.disconnect()

        assert.isEqual(
            FakeDeviceStreamer.numCallsToDisconnect,
            1,
            'Should call streamer.disconnect() on disconnect!'
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
