import { FakeXdfRecorder, XdfRecorder } from '@neurodevs/node-xdf'

import { DeviceStreamer } from 'impl/BiosensorDeviceFactory.js'
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
        name: DeviceName
        options?: DeviceOptions
    }[] = []

    public static callsToCreateDevices: {
        devices: DeviceSpecification[]
        options?: DeviceOptions
    }[] = []

    public static fakeDevice = new FakeDeviceStreamer()
    public static fakeRecorder = new FakeXdfRecorder()

    public constructor() {
        FakeDeviceFactory.numCallsToConstructor++
    }

    public async createDevice(
        name: DeviceName,
        options: DeviceOptions & { xdfRecordPath: string }
    ): Promise<[DeviceStreamer, XdfRecorder]>

    public async createDevice(
        name: DeviceName,
        options?: DeviceOptions
    ): Promise<DeviceStreamer>

    public async createDevice(name: DeviceName, options?: DeviceOptions) {
        FakeDeviceFactory.callsToCreateDevice.push({ name, options })

        const { xdfRecordPath } = options ?? {}

        if (xdfRecordPath) {
            return [this.fakeDevice, this.fakeRecorder] as [
                DeviceStreamer,
                XdfRecorder,
            ]
        }

        return this.fakeDevice as DeviceStreamer
    }

    public async createDevices(
        devices: DeviceSpecification[],
        options: DeviceOptions & { xdfRecordPath: string }
    ): Promise<[DeviceStreamer[], XdfRecorder]>

    public async createDevices(
        devices: DeviceSpecification[],
        options?: DeviceOptions
    ): Promise<DeviceStreamer[]>

    public async createDevices(
        devices: DeviceSpecification[],
        options?: DeviceOptions
    ) {
        FakeDeviceFactory.callsToCreateDevices.push({ devices, options })
        const { xdfRecordPath } = options ?? {}

        const createdDevices = await Promise.all(
            devices.map((device) => this.createDevice(device.name))
        )

        if (xdfRecordPath) {
            return [createdDevices, this.fakeRecorder] as [
                DeviceStreamer[],
                XdfRecorder,
            ]
        }

        return createdDevices
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
