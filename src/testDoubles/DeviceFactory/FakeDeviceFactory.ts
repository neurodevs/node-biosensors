import { FakeXdfRecorder, XdfRecorder } from '@neurodevs/node-xdf'
import {
    CreateDevicesOptions,
    DeviceFactory,
    DeviceName,
    DeviceOptions,
    DeviceSpecification,
} from '../../modules/BiosensorDeviceFactory'
import { DeviceStreamer } from 'modules/BiosensorDeviceFactory'
import FakeDeviceStreamer from '../DeviceStreamer/FakeDeviceStreamer'

export default class FakeDeviceFactory implements DeviceFactory {
    public static numCallsToConstructor = 0
    public static callsToCreateDevice: CallToCreateDevice[] = []
    public static callsToCreateDevices: DeviceSpecification[][] = []

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
        options: CreateDevicesOptions & { xdfRecordPath: string }
    ): Promise<[DeviceStreamer[], XdfRecorder]>

    public async createDevices(
        devices: DeviceSpecification[],
        options?: CreateDevicesOptions
    ): Promise<DeviceStreamer[]>

    public async createDevices(
        devices: DeviceSpecification[],
        options?: CreateDevicesOptions
    ) {
        FakeDeviceFactory.callsToCreateDevices.push(devices)
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
