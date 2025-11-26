import { FakeXdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceFactory,
    DeviceName,
    DeviceOptions,
    DeviceSpecification,
} from '../../impl/BiosensorDeviceFactory.js'
import FakeDeviceStreamer from '../DeviceStreamer/FakeDeviceStreamer.js'

export default class FakeDeviceFactory implements DeviceFactory {
    public static numCallsToConstructor = 0

    public static callsToCreateDevice: {
        deviceName: DeviceName
        options?: DeviceOptions
    }[] = []

    public static callsToCreateDevices: {
        deviceSpecifications: DeviceSpecification[]
        options?: DeviceOptions
    }[] = []

    public static fakeDevice = new FakeDeviceStreamer()
    public static fakeRecorder = new FakeXdfRecorder()

    public constructor() {
        FakeDeviceFactory.numCallsToConstructor++
    }

    public async createDevice(deviceName: DeviceName, options?: DeviceOptions) {
        FakeDeviceFactory.callsToCreateDevice.push({
            deviceName,
            options,
        })

        const { xdfRecordPath } = options ?? {}

        if (xdfRecordPath) {
            return { device: this.fakeDevice, recorder: this.fakeRecorder }
        }

        return { device: this.fakeDevice }
    }

    public async createDevices(
        deviceSpecifications: DeviceSpecification[],
        options?: DeviceOptions
    ) {
        FakeDeviceFactory.callsToCreateDevices.push({
            deviceSpecifications,
            options,
        })

        const { xdfRecordPath } = options ?? {}

        const createdBundles = await Promise.all(
            deviceSpecifications.map((device) =>
                this.createDevice(device.deviceName)
            )
        )

        const createdDevices = createdBundles.map(({ device }) => device)

        if (xdfRecordPath) {
            return { devices: createdDevices, recorder: this.fakeRecorder }
        }

        return { devices: createdDevices }
    }

    public get fakeDevice() {
        return FakeDeviceFactory.fakeDevice
    }

    public get fakeRecorder() {
        return FakeDeviceFactory.fakeRecorder
    }

    public static resetTestDouble() {
        FakeDeviceFactory.numCallsToConstructor = 0
        FakeDeviceFactory.callsToCreateDevice = []
        FakeDeviceFactory.callsToCreateDevices = []
    }
}

export interface CallToCreateDevice {
    name: DeviceName
    options?: DeviceOptions
}
