import { DeviceFactory, DeviceName } from '../../modules/BiosensorDeviceFactory'
import { DeviceStreamer } from '../../types'

export default class FakeDeviceFactory implements DeviceFactory {
    public static numCallsToConstructor = 0
    public static callsToCreateDevice: string[] = []

    public static fakeDevice = {} as DeviceStreamer

    public constructor() {
        FakeDeviceFactory.numCallsToConstructor++
    }

    public async createDevice(name: DeviceName) {
        FakeDeviceFactory.callsToCreateDevice.push(name)
        return FakeDeviceFactory.fakeDevice
    }

    public static resetTestDouble() {
        FakeDeviceFactory.numCallsToConstructor = 0
    }
}
