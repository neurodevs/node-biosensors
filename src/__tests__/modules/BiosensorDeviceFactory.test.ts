import { test, assert, generateId } from '@sprucelabs/test-utils'
import { MuseDeviceStreamerOptions } from '../../devices/MuseDeviceStreamer'
import BiosensorDeviceFactory, {
    DeviceFactory,
    DeviceOptionsMap,
} from '../../modules/BiosensorDeviceFactory'
import FakeMuseDeviceStreamer from '../../testDoubles/devices/FakeMuseDeviceStreamer'
import { DeviceStreamer } from '../../types'
import AbstractBiosensorsTest from '../AbstractBiosensorsTest'

export default class BiosensorDeviceFactoryTest extends AbstractBiosensorsTest {
    private static instance: DeviceFactory

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeDevices()

        this.instance = this.BiosensorDeviceFactory()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsDeviceForCgxDeviceStreamer() {
        const device = this.createCgxDeviceStreamer()
        this.assertDeviceIsTruthy(device)
    }

    @test()
    protected static async createsDeviceForMuseDeviceStreamer() {
        const device = this.createMuseDeviceStreamer()
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
            FakeMuseDeviceStreamer.callsToConstructor[1]!

        assert.isEqualDeep(
            { bleUuid, rssiIntervalMs },
            options,
            'Options do not match!'
        )
    }

    @test()
    protected static async createsDeviceForZephyrDeviceStreamer() {
        const device = this.createZephyrDeviceStreamer()
        this.assertDeviceIsTruthy(device)
    }

    @test()
    protected static async throwsWithInvalidDeviceName() {
        const invalidName = generateId() as any

        await assert.doesThrowAsync(
            async () => await this.createDevice(invalidName),
            `\n\nInvalid device name: ${invalidName}!\n\nPlease choose from:\n\n- Cognionics Quick-20r\n- Muse S Gen 2\n- Zephyr BioHarness 3\n\n`
        )
    }

    private static createCgxDeviceStreamer() {
        return this.createDevice('Cognionics Quick-20r')
    }

    private static createMuseDeviceStreamer(
        options?: MuseDeviceStreamerOptions
    ) {
        return this.createDevice('Muse S Gen 2', options)
    }

    private static createZephyrDeviceStreamer() {
        return this.createDevice('Zephyr BioHarness 3')
    }

    private static createDevice<K extends keyof DeviceOptionsMap>(
        name: K,
        options?: DeviceOptionsMap[K]
    ) {
        return this.instance.createDevice(name, options)
    }

    private static assertDeviceIsTruthy(device: Promise<DeviceStreamer>) {
        assert.isTruthy(device, 'Failed to create device!')
    }

    private static BiosensorDeviceFactory() {
        return BiosensorDeviceFactory.Create()
    }
}
