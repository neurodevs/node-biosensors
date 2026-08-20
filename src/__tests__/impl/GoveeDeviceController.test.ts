import { test, assert } from '@neurodevs/node-tdd'
import { FakeXdfRecorder } from '@neurodevs/node-xdf'
import {
    BleAdvertisement,
    FakeBleObserver,
    FakeLslOutlet,
} from '@neurodevs/node-lsl'

import GoveeDeviceController, {
    GoveeControllerOptions,
} from '../../impl/govee/GoveeDeviceController.js'
import SpyGoveeController from '../../testDoubles/GoveeController/SpyGoveeController.js'
import { LogLevel } from '../../impl/types.js'
import AbstractDeviceControllerTest from '../AbstractDeviceControllerTest.js'

export default class GoveeDeviceControllerTest extends AbstractDeviceControllerTest {
    protected static instance: SpyGoveeController

    private static readonly localName = this.generateId()
    private static readonly timestampSec = 303175.794964291
    private static readonly manufacturerData = '88ec009e084f196402'

    private static readonly streamQueries = [
        'type="Temperature"',
        'type="Humidity"',
        'type="Battery"',
    ]

    private static readonly advertisement: BleAdvertisement = {
        localName: this.localName,
        companyId: 0xec88,
        manufacturerData: this.manufacturerData,
        serviceUuids: [],
        serviceData: {},
        rssi: -55,
        txPowerLevel: null,
        isConnectable: false,
        timestampSec: this.timestampSec,
    }

    private static readonly nonGoveeAdvertisement: BleAdvertisement = {
        ...this.advertisement,
        localName: '',
        companyId: null,
        manufacturerData: '',
    }

    protected static async beforeEach() {
        await super.beforeEach()

        GoveeDeviceController.Class = SpyGoveeController

        this.instance = await this.GoveeDeviceController()
    }

    @test()
    protected static async createsInstance() {
        await this.assertCreatesInstance()
    }

    @test()
    protected static async startsWithIsConnectedFalse() {
        await this.assertStartsWithIsConnectedFalse()
    }

    @test()
    protected static async startsWithIsStreamingFalse() {
        await this.assertStartsWithIsStreamingFalse()
    }

    @test()
    protected static async connectSetsIsConnectedTrue() {
        await this.assertConnectSetsIsConnectedTrue()
    }

    @test()
    protected static async startStreamingSetsIsStreamingTrue() {
        await this.assertStartStreamingSetsIsStreamingTrue()
    }

    @test()
    protected static async startStreamingDoesNotHandleIfNotConnected() {
        await this.assertStartStreamingDoesNotHandleIfNotConnected()
    }

    @test()
    protected static async startStreamingLeavesIsStreamingFalseIfNotConnected() {
        await this.assertStartStreamingLeavesIsStreamingFalseIfNotConnected()
    }

    @test()
    protected static async startStreamingWarnsIfNotConnected() {
        await this.assertStartStreamingWarnsIfNotConnected()
    }

    @test()
    protected static async stopStreamingSetsIsStreamingFalse() {
        await this.assertStopStreamingSetsIsStreamingFalse()
    }

    @test()
    protected static async disconnectSetsIsConnectedFalse() {
        await this.assertDisconnectSetsIsConnectedFalse()
    }

    @test()
    protected static async disconnectCallsStopStreaming() {
        await this.assertDisconnectCallsStopStreaming()
    }

    @test()
    protected static async disconnectDoesNotCallStopStreamingIfNotStreaming() {
        await this.assertDisconnectDoesNotCallStopStreamingIfNotStreaming()
    }

    @test()
    protected static async connectWarnsWithDeviceId() {
        await this.assertConnectWarnsWithDeviceId()
    }

    @test()
    protected static async startStreamingWarnsWithDeviceId() {
        await this.assertStartStreamingWarnsWithDeviceId()
    }

    @test()
    protected static async stopStreamingWarnsWithDeviceId() {
        await this.assertStopStreamingWarnsWithDeviceId()
    }

    @test()
    protected static async disconnectWarnsWithDeviceId() {
        await this.assertDisconnectWarnsWithDeviceId()
    }

    @test()
    protected static async createsXdfRecorderIfPassedPath() {
        await this.assertCreatesXdfRecorderIfPassedPath()
    }

    @test()
    protected static async connectStartsXdfRecorder() {
        await this.assertConnectStartsXdfRecorder()
    }

    @test()
    protected static async disconnectFinishesXdfRecorder() {
        await this.assertDisconnectFinishesXdfRecorder()
    }

    @test()
    protected static async exposesUuidFromDeviceUuid() {
        assert.isEqual(
            this.instance.bleUuid,
            this.deviceId,
            'Did not expose the device uuid!'
        )
    }

    @test()
    protected static async startsWithNotAvailableBleName() {
        assert.isEqual(
            this.instance.bleName,
            'N/A',
            'Should not have a bleName before receiving an advertisement!'
        )
    }

    @test()
    protected static async exposesBleNameFromAdvertisement() {
        await this.simulateAdvertisementWhileStreaming()

        assert.isEqual(
            this.instance.bleName,
            this.localName,
            'Did not expose the bleName from the advertisement!'
        )
    }

    @test()
    protected static async exposesLslOutlets() {
        const sourceIds = this.instance.outlets.map((outlet) => outlet.sourceId)

        assert.isEqualDeep(
            sourceIds,
            ['govee-temperature', 'govee-humidity', 'govee-battery'],
            'Did not expose outlets!'
        )
    }

    @test()
    protected static async logsIfPassedLogLevelInfo() {
        await this.assertLogsIfPassedLogLevelInfo()
    }

    @test()
    protected static async doesNotLogInfoIfLogLevelSilent() {
        await this.assertDoesNotLogInfoIfLogLevelSilent()
    }

    @test()
    protected static async doesNotLogByDefault() {
        await this.assertDoesNotLogByDefault()
    }

    @test()
    protected static async warnsIfLogLevelInfo() {
        await this.assertWarnsIfLogLevelInfo()
    }

    @test()
    protected static async doesNotWarnIfLogLevelSilent() {
        await this.assertDoesNotWarnIfLogLevelSilent()
    }

    @test()
    protected static async createsWriteStreamIfPassedTxtRecordPath() {
        await this.assertCreatesWriteStreamIfPassedTxtRecordPath()
    }

    @test()
    protected static async doesNotCreateWriteStreamByDefault() {
        await this.assertDoesNotCreateWriteStreamByDefault()
    }

    @test()
    protected static async writesNewlineTerminatedLinesToTxtRecord() {
        await this.assertWritesNewlineTerminatedLinesToTxtRecord()
    }

    @test()
    protected static async exposesStreamQueries() {
        assert.isEqualDeep(
            this.instance.streamQueries,
            this.streamQueries,
            'Did not expose stream queries!'
        )
    }

    @test()
    protected static async passesStreamQueriesToXdfRecorder() {
        const { streamQueries } = FakeXdfRecorder.callsToConstructor[0] ?? {}

        assert.isEqualDeep(
            streamQueries,
            this.streamQueries,
            'Did not pass the stream queries to the XdfRecorder!'
        )
    }

    @test()
    protected static async createsLslOutletForTemperature() {
        assert.isEqualDeep(
            FakeLslOutlet.callsToConstructor[0],
            {
                sourceId: 'govee-temperature',
                name: 'Govee Temperature',
                type: 'Temperature',
                channelNames: ['Temperature'],
                sampleRateHz: 0,
                channelFormat: 'float32',
                manufacturer: 'Govee',
                units: 'Celsius',
                chunkSize: 1,
            },
            'Did not create an LslOutlet for temperature!'
        )
    }

    @test()
    protected static async createsLslOutletForHumidity() {
        assert.isEqualDeep(
            FakeLslOutlet.callsToConstructor[1],
            {
                sourceId: 'govee-humidity',
                name: 'Govee Humidity',
                type: 'Humidity',
                channelNames: ['Humidity'],
                sampleRateHz: 0,
                channelFormat: 'float32',
                manufacturer: 'Govee',
                units: 'percent',
                chunkSize: 1,
            },
            'Did not create an LslOutlet for humidity!'
        )
    }

    @test()
    protected static async createsLslOutletForBattery() {
        assert.isEqualDeep(
            FakeLslOutlet.callsToConstructor[2],
            {
                sourceId: 'govee-battery',
                name: 'Govee Battery',
                type: 'Battery',
                channelNames: ['Battery'],
                sampleRateHz: 0,
                channelFormat: 'float32',
                manufacturer: 'Govee',
                units: 'percent',
                chunkSize: 1,
            },
            'Did not create an LslOutlet for battery!'
        )
    }

    @test()
    protected static async createsBleObserverControllerOnConnect() {
        await this.connect()

        const { deviceUuid } = FakeBleObserver.callsToConstructor[0] ?? {}

        assert.isEqualDeep(
            { deviceUuid },
            { deviceUuid: this.deviceId },
            'Did not create a BleObserverController with the device uuid!'
        )
    }

    @test()
    protected static async passesOnAdvertisementToBleObserverOnConnect() {
        await this.connect()

        assert.isFunction(
            this.onAdvertisement,
            'Did not pass an onAdvertisement callback to the BleObserver!'
        )
    }

    @test()
    protected static async onAdvertisementLogsPacketWhenStreaming() {
        this.instance = await this.GoveeDeviceController({ logLevel: 'info' })

        await this.simulateAdvertisementWhileStreaming()

        assert.isEqual(
            this.callsToInfo[0][0],
            `[${this.timestampSec}] temperature: 22.06°C, humidity: 64.79%, battery: 100%`,
            'Did not log the advertisement as expected!'
        )
    }

    @test()
    protected static async onAdvertisementPushesTemperatureToOutlet() {
        await this.simulateAdvertisementWhileStreaming()

        assert.isEqualDeep(
            FakeLslOutlet.callsToPushSample[0],
            { sample: [22.06], timestampSec: this.timestampSec },
            'Did not push the temperature to its LslOutlet!'
        )
    }

    @test()
    protected static async onAdvertisementPushesHumidityToOutlet() {
        await this.simulateAdvertisementWhileStreaming()

        assert.isEqualDeep(
            FakeLslOutlet.callsToPushSample[1],
            { sample: [64.79], timestampSec: this.timestampSec },
            'Did not push the humidity to its LslOutlet!'
        )
    }

    @test()
    protected static async onAdvertisementPushesBatteryToOutlet() {
        await this.simulateAdvertisementWhileStreaming()

        assert.isEqualDeep(
            FakeLslOutlet.callsToPushSample[2],
            { sample: [100], timestampSec: this.timestampSec },
            'Did not push the battery to its LslOutlet!'
        )
    }

    @test()
    protected static async doesNotLogAdvertisementIfNotStreaming() {
        await this.connect()

        this.simulateAdvertisement()

        assert.isLength(
            this.callsToInfo,
            0,
            'Should not log advertisements when connected but not streaming!'
        )
    }

    @test()
    protected static async doesNotLogAdvertisementIfNotGoveeCompanyId() {
        await this.connect()
        await this.startStreaming()

        this.onAdvertisement(this.nonGoveeAdvertisement)

        assert.isLength(
            this.callsToInfo,
            0,
            'Should not log advertisements that are not from the Govee device!'
        )
    }

    @test()
    protected static async logsTemperatureInFahrenheitIfPassedTemperatureUnits() {
        this.instance = await this.GoveeDeviceController({
            temperatureUnits: 'Fahrenheit',
            logLevel: 'info',
        })

        await this.simulateAdvertisementWhileStreaming()

        assert.isEqual(
            this.callsToInfo[0][0],
            `[${this.timestampSec}] temperature: 71.71°F, humidity: 64.79%, battery: 100%`,
            'Did not log the temperature in Fahrenheit!'
        )
    }

    @test()
    protected static async logsTemperatureInKelvinIfPassedTemperatureUnits() {
        this.instance = await this.GoveeDeviceController({
            temperatureUnits: 'Kelvin',
            logLevel: 'info',
        })

        await this.simulateAdvertisementWhileStreaming()

        assert.isEqual(
            this.callsToInfo[0][0],
            `[${this.timestampSec}] temperature: 295.21K, humidity: 64.79%, battery: 100%`,
            'Did not log the temperature in Kelvin!'
        )
    }

    @test()
    protected static async connectCallsStartObservingOnBleObserver() {
        await this.connect()

        assert.isEqual(
            FakeBleObserver.numCallsToStartObserving,
            1,
            'Did not call startObserving on the BleObserver!'
        )
    }

    @test()
    protected static async connectDoesNotStartObservingIfAlreadyConnected() {
        await this.connect()
        await this.connect()

        assert.isEqual(
            FakeBleObserver.numCallsToStartObserving,
            1,
            'Should not call startObserving if already connected!'
        )
    }

    @test()
    protected static async disconnectCallsStopObservingOnBleObserver() {
        await this.connect()
        await this.disconnect()

        assert.isEqual(
            FakeBleObserver.numCallsToStopObserving,
            1,
            'Did not call stopObserving on the BleObserver!'
        )
    }

    @test()
    protected static async disconnectDoesNotStopObservingIfNotConnected() {
        await this.disconnect()

        assert.isEqual(
            FakeBleObserver.numCallsToStopObserving,
            0,
            'Should not call stopObserving if not connected!'
        )
    }

    protected static async simulateDataWithLogLevel(logLevel?: LogLevel) {
        this.instance = await this.GoveeDeviceController({ logLevel })

        await this.simulateAdvertisementWhileStreaming()
    }

    protected static async simulateDataWithTxtRecordPath() {
        this.instance = await this.GoveeDeviceController({
            txtRecordPath: this.txtRecordPath,
        })

        await this.simulateAdvertisementWhileStreaming()
    }

    protected static async simulateDataWithoutTxtRecordPath() {
        await this.simulateAdvertisementWhileStreaming()
    }

    private static async simulateAdvertisementWhileStreaming() {
        await this.connect()
        await this.startStreaming()

        this.simulateAdvertisement()
    }

    private static simulateAdvertisement() {
        this.onAdvertisement(this.advertisement)
    }

    private static get onAdvertisement() {
        const { onAdvertisement } = FakeBleObserver.callsToConstructor.at(-1)!
        return onAdvertisement!
    }

    protected static async ControllerWithLogLevel(logLevel: LogLevel) {
        return await this.GoveeDeviceController({ logLevel })
    }

    private static async GoveeDeviceController(
        options?: Partial<GoveeControllerOptions>
    ) {
        const govee = await GoveeDeviceController.Create({
            deviceUuid: this.deviceId,
            xdfRecordPath: this.xdfRecordPath,
            ...options,
        })
        return govee as SpyGoveeController
    }
}
