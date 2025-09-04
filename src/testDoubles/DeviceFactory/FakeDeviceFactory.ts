import { XdfRecorder } from '@neurodevs/node-xdf'
import {
    CreateDevicesOptions,
    DeviceFactory,
    DeviceName,
    DeviceOptions,
    DeviceSpecification,
} from '../../modules/BiosensorDeviceFactory'
import { DeviceStreamer } from '../../types'

export default class FakeDeviceFactory implements DeviceFactory {
    public static numCallsToConstructor = 0
    public static callsToCreateDevice: CallToCreateDevice[] = []
    public static callsToCreateDevices: DeviceSpecification[][] = []

    public static fakeDevice = {} as DeviceStreamer

    public constructor() {
        FakeDeviceFactory.numCallsToConstructor++
    }

    public async createDevice(name: DeviceName, options?: DeviceOptions) {
        FakeDeviceFactory.callsToCreateDevice.push({ name, options })
        return FakeDeviceFactory.fakeDevice
    }

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
            const recorder = {} as XdfRecorder
            return [createdDevices, recorder] as [DeviceStreamer[], XdfRecorder]
        }

        return createdDevices
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
