import { test, assert } from '@sprucelabs/test-utils'
import generateId from '@neurodevs/generate-id'
import { FakeXdfRecorder, XdfRecorder } from '@neurodevs/node-xdf'
import {
    DeviceStreamer,
    DeviceStreamerOptions,
} from 'impl/BiosensorDeviceFactory'
import BiosensorArrayMonitor from '../../impl/BiosensorArrayMonitor'
import BiosensorDeviceFactory, {
    DeviceFactory,
    DeviceSpecification,
} from '../../impl/BiosensorDeviceFactory'
import CgxDeviceStreamer from '../../impl/devices/CgxDeviceStreamer'
import MuseDeviceStreamer, {
    MuseDeviceStreamerOptions,
} from '../../impl/devices/MuseDeviceStreamer'
import FakeArrayMonitor from '../../testDoubles/ArrayMonitor/FakeArrayMonitor'
import FakeMuseDeviceStreamer from '../../testDoubles/DeviceStreamer/MuseDeviceStreamer/FakeMuseDeviceStreamer'
import AbstractPackageTest from '../AbstractPackageTest'

export default class BiosensorDeviceFactoryTest extends AbstractPackageTest {
    private static instance: DeviceFactory

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeDevices()
        this.setFakeArrayMonitor()

        this.instance = this.BiosensorDeviceFactory()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsDeviceForCgxDeviceStreamer() {
        const device = await this.createCgxDeviceStreamer()
        this.assertDeviceIsTruthy(device)
    }

    @test()
    protected static async createsDeviceForMuseDeviceStreamer() {
        const device = await this.createMuseDeviceStreamer()
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
        const device = await this.createZephyrDeviceStreamer()
        this.assertDeviceIsTruthy(device)
    }

    @test()
    protected static async throwsWithInvalidDeviceName() {
        const invalidName = generateId() as any

        await assert.doesThrowAsync(
            async () => await this.instance.createDevice(invalidName),
            `\n\nInvalid device name: ${invalidName}!\n\nPlease choose from:\n\n- Cognionics Quick-20r\n- Muse S Gen 2\n- Zephyr BioHarness 3\n\n`
        )
    }

    @test()
    protected static async createsMultipleDevicesAtOnce() {
        const devices = await this.createDevices()
        assert.isEqual(devices.length, this.specs.length, 'Incorrect length!')
    }

    @test()
    protected static async createsXdfRecorderWithXdfRecordPath() {
        await this.createDevices(true)

        assert.isEqualDeep(
            FakeXdfRecorder.callsToConstructor[0]?.xdfRecordPath,
            this.xdfRecordPath,
            'XDF record path does not match!'
        )
    }

    @test()
    protected static async createsXdfRecorderWithStreamQueries() {
        await this.createDevices(true)

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
        const [, recorder] = await this.createDevices(true)
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
        const [, recorder] = await this.createCgxWithXdfRecorder()
        assert.isTruthy(recorder, 'Did not return XdfRecorder!')
    }

    @test()
    protected static async onlyCreatesOneInstanceOfXdfRecorder() {
        await this.createDevices(true)

        assert.isEqual(
            FakeXdfRecorder.callsToConstructor.length,
            1,
            'Created multiple instances of XdfRecorder!'
        )
    }

    @test()
    protected static async createsBiosensorArrayMonitor() {
        await this.createDevices()

        assert.isEqual(
            FakeArrayMonitor.callsToConstructor.length,
            1,
            'Did not create class as expected!'
        )
    }

    private static async createCgxWithXdfRecorder() {
        return (await this.createCgxDeviceStreamer({
            xdfRecordPath: this.xdfRecordPath,
        })) as unknown as [DeviceStreamer, XdfRecorder]
    }

    private static async createDevices(includeXdfRecorder = false) {
        return await this.instance.createDevices(this.specs, {
            xdfRecordPath: includeXdfRecorder ? this.xdfRecordPath : undefined,
        })
    }

    private static xdfRecordPath = generateId()

    private static specs: DeviceSpecification[] = [
        { name: 'Cognionics Quick-20r' },
        { name: 'Muse S Gen 2' },
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

    private static setFakeArrayMonitor() {
        BiosensorArrayMonitor.Class = FakeArrayMonitor
        FakeArrayMonitor.resetTestDouble()
    }

    private static BiosensorDeviceFactory() {
        return BiosensorDeviceFactory.Create() as DeviceFactory
    }
}
