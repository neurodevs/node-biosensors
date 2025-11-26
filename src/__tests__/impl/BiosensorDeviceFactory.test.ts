import { randomInt } from 'crypto'
import generateId from '@neurodevs/generate-id'
import { FakeWebSocketServer } from '@neurodevs/node-lsl'
import { test, assert } from '@neurodevs/node-tdd'
import { FakeXdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceStreamer,
    DeviceStreamerOptions,
} from 'impl/BiosensorDeviceFactory.js'
import BiosensorDeviceFactory, {
    DeviceFactory,
    DeviceSpecification,
} from '../../impl/BiosensorDeviceFactory.js'
import BiosensorWebSocketGateway from '../../impl/BiosensorWebSocketGateway.js'
import CgxDeviceStreamer from '../../impl/devices/CgxDeviceStreamer.js'
import MuseDeviceStreamer, {
    MuseDeviceStreamerOptions,
} from '../../impl/devices/MuseDeviceStreamer.js'
import FakeMuseDeviceStreamer from '../../testDoubles/DeviceStreamer/MuseDeviceStreamer/FakeMuseDeviceStreamer.js'
import FakeWebSocketGateway from '../../testDoubles/WebSocketGateway/FakeWebSocketGateway.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class BiosensorDeviceFactoryTest extends AbstractPackageTest {
    private static instance: DeviceFactory

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
    protected static async createsDeviceForCgxDeviceStreamer() {
        const { device } = await this.createCgxDeviceStreamer()
        this.assertDeviceIsTruthy(device)
    }

    @test()
    protected static async createsDeviceForMuseDeviceStreamer() {
        const { device } = await this.createMuseDeviceStreamer()
        this.assertDeviceIsTruthy(device)
    }

    @test()
    protected static async createsDeviceForMuseDeviceStreamerWithOptions() {
        const options = {
            bleUuid: generateId(),
            rssiIntervalMs: Math.random(),
        }

        await this.createMuseDeviceStreamer(options)

        const { bleUuid, rssiIntervalMs } =
            FakeMuseDeviceStreamer.callsToConstructor[0]!

        assert.isEqualDeep(
            { bleUuid, rssiIntervalMs },
            options,
            'Options do not match!'
        )
    }

    @test()
    protected static async createsDeviceForZephyrDeviceStreamer() {
        const { device } = await this.createZephyrDeviceStreamer()
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
        await this.createDevicesWithXdfRecorder()

        assert.isEqualDeep(
            FakeXdfRecorder.callsToConstructor[0]?.xdfRecordPath,
            this.xdfRecordPath,
            'XDF record path does not match!'
        )
    }

    @test()
    protected static async createsXdfRecorderWithStreamQueries() {
        await this.createDevicesWithXdfRecorder()

        assert.isEqualDeep(
            FakeXdfRecorder.callsToConstructor[0]?.streamQueries,
            [
                ...CgxDeviceStreamer.streamQueries,
                ...MuseDeviceStreamer.streamQueries,
            ],
            'Stream queries do not match!'
        )
    }

    @test()
    protected static async returnsXdfRecorder() {
        const { recorder } = await this.createDevicesWithXdfRecorder()
        assert.isTruthy(recorder, 'Did not return XdfRecorder!')
    }

    @test()
    protected static async createDeviceCreatesXdfRecorder() {
        await this.createCgxWithXdfRecorder()

        const { xdfRecordPath, streamQueries } =
            FakeXdfRecorder.callsToConstructor[0]!

        assert.isEqualDeep(
            { xdfRecordPath, streamQueries },
            {
                xdfRecordPath: this.xdfRecordPath,
                streamQueries: [...CgxDeviceStreamer.streamQueries],
            },
            'Passed incorrect options to XdfRecorder!'
        )
    }

    @test()
    protected static async createDeviceReturnsXdfRecorder() {
        const { recorder } = await this.createCgxWithXdfRecorder()
        assert.isTruthy(recorder, 'Did not return XdfRecorder!')
    }

    @test()
    protected static async onlyCreatesOneInstanceOfXdfRecorder() {
        await this.createDevicesWithXdfRecorder()

        assert.isEqual(
            FakeXdfRecorder.callsToConstructor.length,
            1,
            'Created multiple instances of XdfRecorder!'
        )
    }

    @test()
    protected static async createsBiosensorWebSocketGateway() {
        await this.createDevicesWithGateway()

        assert.isEqualDeep(
            FakeWebSocketServer.callsToConstructor,
            [
                { port: this.wssPortStart },
                { port: this.wssPortStart + 1 },
                { port: this.wssPortStart + 2 },
                { port: this.wssPortStart + 3 },
            ],
            'Did not create gateway with expected devices!'
        )
    }

    @test()
    protected static async returnsBiosensorWebSocketGateway() {
        const { gateway } = await this.createDevicesWithGateway()
        assert.isTruthy(gateway, 'Did not return gateway!')
    }

    private static async createCgxWithXdfRecorder() {
        return await this.createCgxDeviceStreamer({
            xdfRecordPath: this.xdfRecordPath,
        })
    }

    private static createDevicesWithXdfRecorder() {
        return this.createDevices({ includeXdfRecorder: true })
    }

    private static createDevicesWithGateway() {
        return this.createDevices({ useWebSocketGateway: true })
    }

    private static async createDevices({
        includeXdfRecorder = false,
        useWebSocketGateway = false,
    } = {}) {
        return await this.instance.createDevices(this.deviceSpecifications, {
            xdfRecordPath: includeXdfRecorder ? this.xdfRecordPath : undefined,
            wssPortStart: useWebSocketGateway ? this.wssPortStart : undefined,
        })
    }

    private static readonly xdfRecordPath = generateId()
    private static readonly wssPortStart = randomInt(1000, 5000)

    private static deviceSpecifications: DeviceSpecification[] = [
        { deviceName: 'Cognionics Quick-20r' },
        { deviceName: 'Muse S Gen 2' },
    ]

    private static createCgxDeviceStreamer(options?: DeviceStreamerOptions) {
        return this.instance.createDevice('Cognionics Quick-20r', options)
    }

    private static createMuseDeviceStreamer(
        options?: MuseDeviceStreamerOptions
    ) {
        return this.instance.createDevice('Muse S Gen 2', options)
    }

    private static createZephyrDeviceStreamer(options?: DeviceStreamerOptions) {
        return this.instance.createDevice('Zephyr BioHarness 3', options)
    }

    private static assertDeviceIsTruthy(device: DeviceStreamer) {
        assert.isTruthy(device, 'Failed to create device!')
    }

    private static setFakeWebSocketGateway() {
        BiosensorWebSocketGateway.Class = FakeWebSocketGateway
        FakeWebSocketGateway.resetTestDouble()
    }

    private static BiosensorDeviceFactory() {
        return BiosensorDeviceFactory.Create() as DeviceFactory
    }
}
