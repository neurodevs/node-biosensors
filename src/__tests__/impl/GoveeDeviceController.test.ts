import { test, assert } from '@neurodevs/node-tdd'
import {
    BleAdvertisement,
    FakeBleObserver,
    FakeLslOutlet,
} from '@neurodevs/node-lsl'

import GoveeDeviceController, {
    temperatureUnits,
} from '../../impl/govee/GoveeDeviceController.js'
import SpyGoveeController from '../../testDoubles/GoveeController/SpyGoveeController.js'
import AbstractDeviceControllerTest from '../AbstractDeviceControllerTest.js'

export default class GoveeDeviceControllerTest extends AbstractDeviceControllerTest {
    protected static instance: SpyGoveeController
    private static lastLog?: string

    private static readonly timestampSec = 303175.794964291
    private static readonly manufacturerData = '88ec009e084f196402'

    private static readonly advertisement: BleAdvertisement = {
        localName: 'GVH5179_9106',
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

        this.setFakeLog()

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
    protected static async exposesLslOutlets() {
        assert.isEqual(
            this.instance.outlets.length,
            0,
            'Did not expose outlets!'
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
    protected static async createsBleObserverController() {
        const { deviceUuid } = FakeBleObserver.callsToConstructor[0] ?? {}

        assert.isEqualDeep(
            { deviceUuid },
            { deviceUuid: this.deviceId },
            'Did not create a BleObserverController with the device uuid!'
        )
    }

    @test()
    protected static async passesOnAdvertisementToBleObserver() {
        assert.isFunction(
            this.onAdvertisement,
            'Did not pass an onAdvertisement callback to the BleObserver!'
        )
    }

    @test()
    protected static async onAdvertisementLogsPacketWhenStreaming() {
        await this.simulateAdvertisementWhileStreaming()

        assert.isEqual(
            this.lastLog,
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

        assert.isUndefined(
            this.lastLog,
            'Should not log advertisements when connected but not streaming!'
        )
    }

    @test()
    protected static async doesNotLogAdvertisementIfNotGoveeCompanyId() {
        await this.connect()
        await this.startStreaming()

        this.onAdvertisement(this.nonGoveeAdvertisement)

        assert.isUndefined(
            this.lastLog,
            'Should not log advertisements that are not from the Govee device!'
        )
    }

    @test()
    protected static async logsTemperatureInFahrenheitIfPassedTemperatureUnits() {
        this.instance = await this.GoveeDeviceController('Fahrenheit')

        await this.simulateAdvertisementWhileStreaming()

        assert.isEqual(
            this.lastLog,
            `[${this.timestampSec}] temperature: 71.71°F, humidity: 64.79%, battery: 100%`,
            'Did not log the temperature in Fahrenheit!'
        )
    }

    @test()
    protected static async logsTemperatureInKelvinIfPassedtemperatureUnits() {
        this.instance = await this.GoveeDeviceController('Kelvin')

        await this.simulateAdvertisementWhileStreaming()

        assert.isEqual(
            this.lastLog,
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

    private static setFakeLog() {
        this.lastLog = undefined

        GoveeDeviceController.log = {
            info: (msg: string) => {
                this.lastLog = msg
            },
        } as Console
    }

    private static async GoveeDeviceController(
        temperatureUnits?: temperatureUnits
    ) {
        const govee = await GoveeDeviceController.Create({
            deviceUuid: this.deviceId,
            xdfRecordPath: this.xdfRecordPath,
            temperatureUnits,
        })
        return govee as SpyGoveeController
    }
}
