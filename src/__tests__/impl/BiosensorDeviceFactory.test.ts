import { randomInt } from 'node:crypto'

import generateId from '@neurodevs/generate-id'
import {
    FakeEventMarkerEmitter,
    FakeWebSocketServer,
} from '@neurodevs/node-lsl'
import { test, assert } from '@neurodevs/node-tdd'
import { FakeXdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceController,
    DeviceControllerOptions,
} from '../../impl/BiosensorDeviceFactory.js'
import BiosensorDeviceFactory, {
    DeviceFactory,
    DeviceSpecification,
} from '../../impl/BiosensorDeviceFactory.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import { MuseControllerOptions } from '../../impl/devices/MuseDeviceController.js'
import FakeMuseController from '../../testDoubles/devices/MuseController/FakeMuseController.js'

export default class BiosensorDeviceFactoryTest extends AbstractPackageTest {
    private static instance: DeviceFactory

    private static readonly xdfRecordPath = generateId()
    private static readonly webSocketPortStart = randomInt(1000, 5000)
    private static readonly museBleUuid = this.generateId()
    private static readonly cgxStreamQueries = ['type="EEG"', 'type="ACCEL"']
    private static readonly museSGen2StreamQueries = [
        'type="EEG"',
        'type="PPG"',
        'type="GYRO"',
        'type="ACCEL"',
    ]

    private static readonly deviceSpecifications: DeviceSpecification[] = [
        { deviceName: 'Cognionics Quick-20r' },
        { deviceName: 'Muse S Gen 2', options: { bleUuid: this.museBleUuid } },
    ]

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeDevices()
        this.setFakeWebSocketGateway()

        this.instance = this.BiosensorDeviceFactory()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsDeviceForCgxController() {
        const { device } = await this.createCgxController()
        this.assertDeviceIsTruthy(device)
    }

    @test()
    protected static async createsDeviceForMuseController() {
        const { device } = await this.createMuseController()
        this.assertDeviceIsTruthy(device)
    }

    @test()
    protected static async createsDeviceForZephyrController() {
        const { device } = await this.createZephyrController()
        this.assertDeviceIsTruthy(device)
    }

    @test()
    protected static async throwsWithInvalidDeviceName() {
        const invalidName = generateId() as any

        await assert.doesThrowAsync(
            async () => await this.instance.createDevice(invalidName),
            `\n\n Invalid device name: ${invalidName}! \n\n Please choose from: \n\n - Cognionics Quick-20r \n - Muse S Gen 2 \n - Zephyr BioHarness 3 \n\n`
        )
    }

    @test()
    protected static async createsMultipleDevicesAtOnce() {
        const { devices } = await this.createDevices()

        assert.isEqual(
            devices.length,
            this.deviceSpecifications.length,
            'Incorrect length!'
        )
    }

    @test()
    protected static async createsXdfRecorderWithXdfRecordPath() {
        await this.createDevicesWithRecorder()

        assert.isEqualDeep(
            FakeXdfRecorder.callsToConstructor[0]?.xdfRecordPath,
            this.xdfRecordPath,
            'XDF record path does not match!'
        )
    }

    @test()
    protected static async createsXdfRecorderWithStreamQueries() {
        await this.createDevicesWithRecorder()

        assert.isEqualDeep(
            FakeXdfRecorder.callsToConstructor[0]?.streamQueries,
            [...this.cgxStreamQueries, ...this.museSGen2StreamQueries],
            'Stream queries do not match!'
        )
    }

    @test()
    protected static async returnsXdfRecorder() {
        const { recorder } = await this.createDevicesWithRecorder()
        assert.isTruthy(recorder, 'Did not return XdfRecorder!')
    }

    @test()
    protected static async createDeviceCreatesXdfRecorder() {
        await this.createCgxWithRecorder()

        const { xdfRecordPath, streamQueries } =
            FakeXdfRecorder.callsToConstructor[0]!

        assert.isEqualDeep(
            { xdfRecordPath, streamQueries },
            {
                xdfRecordPath: this.xdfRecordPath,
                streamQueries: [...this.cgxStreamQueries],
            },
            'Passed incorrect options to XdfRecorder!'
        )
    }

    @test()
    protected static async createDeviceReturnsXdfRecorder() {
        const { recorder } = await this.createCgxWithRecorder()
        assert.isTruthy(recorder, 'Did not return XdfRecorder!')
    }

    @test()
    protected static async onlyCreatesOneInstanceOfXdfRecorder() {
        await this.createDevicesWithRecorder()

        assert.isEqual(
            FakeXdfRecorder.callsToConstructor.length,
            1,
            'Created multiple instances of XdfRecorder!'
        )
    }

    @test()
    protected static async createDeviceCreatesWebSocketGateway() {
        await this.createDeviceWithGateway()

        assert.isEqualDeep(
            FakeWebSocketServer.callsToConstructor,
            [
                { port: this.webSocketPortStart },
                { port: this.webSocketPortStart + 1 },
            ],
            'Did not create gateway with expected devices!'
        )
    }

    @test()
    protected static async createDeviceReturnsWebSocketGateway() {
        const { gateway } = await this.createDeviceWithGateway()
        assert.isTruthy(gateway, 'Did not return gateway!')
    }

    @test()
    protected static async createDevicesCreatesWebSocketGateway() {
        await this.createDevicesWithGateway()

        assert.isEqualDeep(
            FakeWebSocketServer.callsToConstructor,
            [
                { port: this.webSocketPortStart },
                { port: this.webSocketPortStart + 1 },
                { port: this.webSocketPortStart + 2 },
                { port: this.webSocketPortStart + 3 },
            ],
            'Did not create gateway with expected devices!'
        )
    }

    @test()
    protected static async createDevicesReturnsWebSocketGateway() {
        const { gateway } = await this.createDevicesWithGateway()
        assert.isTruthy(gateway, 'Did not return gateway!')
    }

    @test()
    protected static async createDeviceCreatesEventMarkerEmitterIfRequested() {
        await this.instance.createDevice('Cognionics Quick-20r', {
            createEventMarkerEmitter: true,
        })

        assert.isEqualDeep(
            FakeEventMarkerEmitter.numCallsToConstructor,
            1,
            'Did not create marker outlet!'
        )
    }

    @test()
    protected static async createDeviceReturnsEventMarkerEmitterIfRequested() {
        const { emitter } = await this.createDeviceWithEmitter()
        assert.isTruthy(emitter, 'Did not return event marker emitter!')
    }

    @test()
    protected static async createDevicesCreatesEventMarkerEmitterIfRequested() {
        await this.createDevicesWithEmitter()

        assert.isEqualDeep(
            FakeEventMarkerEmitter.numCallsToConstructor,
            1,
            'Did not create marker emitter!'
        )
    }

    @test()
    protected static async createDevicesReturnsEventMarkerEmitterIfRequested() {
        const { emitter } = await this.createDevicesWithEmitter()
        assert.isTruthy(emitter, 'Did not return event marker emitter!')
    }

    @test()
    protected static async passesBleUuidToMuseController() {
        await this.createMuseController()

        const actual = FakeMuseController.callsToConstructor[0].ble.uuid

        assert.isEqual(
            actual,
            this.museBleUuid,
            'Did not create Muse with expected options!'
        )
    }

    @test()
    protected static async creatingMuseControllerCallsConnect() {
        await this.createMuseController()

        assert.isEqual(
            FakeMuseController.numCallsToConnect,
            1,
            'Did not call connect on Muse!'
        )
    }

    private static async createDeviceWithEmitter() {
        return await this.instance.createDevice('Cognionics Quick-20r', {
            createEventMarkerEmitter: true,
        })
    }

    private static async createDevicesWithEmitter() {
        return await this.instance.createDevices(this.deviceSpecifications, {
            createEventMarkerEmitter: true,
        })
    }

    private static async createCgxWithRecorder() {
        return await this.createCgxController({
            xdfRecordPath: this.xdfRecordPath,
        })
    }

    private static async createDevicesWithRecorder() {
        return this.createDevices({ includeXdfRecorder: true })
    }

    private static async createDevicesWithGateway() {
        return this.createDevices({ useWebSocketGateway: true })
    }

    private static async createDevices({
        includeXdfRecorder = false,
        useWebSocketGateway = false,
    } = {}) {
        return await this.instance.createDevices(this.deviceSpecifications, {
            xdfRecordPath: includeXdfRecorder ? this.xdfRecordPath : undefined,
            webSocketPortStart: useWebSocketGateway
                ? this.webSocketPortStart
                : undefined,
        })
    }

    private static async createDeviceWithGateway() {
        return await this.instance.createDevice('Cognionics Quick-20r', {
            webSocketPortStart: this.webSocketPortStart,
        })
    }

    private static async createCgxController(
        options?: DeviceControllerOptions
    ) {
        return this.instance.createDevice('Cognionics Quick-20r', options)
    }

    private static async createMuseController(options?: MuseControllerOptions) {
        return this.instance.createDevice('Muse S Gen 2', {
            bleUuid: this.museBleUuid,
            ...options,
        })
    }

    private static async createZephyrController(
        options?: DeviceControllerOptions
    ) {
        return this.instance.createDevice('Zephyr BioHarness 3', options)
    }

    private static assertDeviceIsTruthy(device: DeviceController) {
        assert.isTruthy(device, 'Failed to create device!')
    }

    private static BiosensorDeviceFactory() {
        return BiosensorDeviceFactory.Create() as DeviceFactory
    }
}
