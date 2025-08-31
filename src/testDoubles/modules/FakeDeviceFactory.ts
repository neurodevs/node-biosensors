import {
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

    public async createDevices(devices: DeviceSpecification[]) {
        FakeDeviceFactory.callsToCreateDevices.push(devices)

        return Promise.all(
            devices.map((device) => this.createDevice(device.name))
        )
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
