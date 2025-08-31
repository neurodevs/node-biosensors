import { test, assert } from '@sprucelabs/test-utils'
import BiosensorDeviceFactory, {
    DeviceFactory,
    DeviceName,
} from '../../modules/BiosensorDeviceFactory'
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
    protected static async createsDeviceForZephyrDeviceStreamer() {
        const device = this.createZephyrDeviceStreamer()
        this.assertDeviceIsTruthy(device)
    }

    private static createCgxDeviceStreamer() {
        return this.createDevice('Cognionics Quick-20r')
    }

    private static createMuseDeviceStreamer() {
        return this.createDevice('Muse S Gen 2')
    }

    private static createZephyrDeviceStreamer() {
        return this.createDevice('Zephyr BioHarness 3')
    }

    private static createDevice(name: DeviceName) {
        return this.instance.createDevice(name)
    }

    private static assertDeviceIsTruthy(device: Promise<DeviceStreamer>) {
        assert.isTruthy(device, 'Failed to create device!')
    }

    private static BiosensorDeviceFactory() {
        return BiosensorDeviceFactory.Create()
    }
}
