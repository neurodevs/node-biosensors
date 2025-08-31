import {
    DeviceFactory,
    DeviceName,
    DeviceSpecification,
} from '../../modules/BiosensorDeviceFactory'
import { DeviceStreamer } from '../../types'

export default class FakeDeviceFactory implements DeviceFactory {
    public static numCallsToConstructor = 0
    public static callsToCreateDevice: string[] = []
    public static callsToCreateDevices: DeviceSpecification[][] = []

    public static fakeDevice = {} as DeviceStreamer

    public constructor() {
        FakeDeviceFactory.numCallsToConstructor++
    }

    public async createDevice(name: DeviceName) {
        FakeDeviceFactory.callsToCreateDevice.push(name)
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
