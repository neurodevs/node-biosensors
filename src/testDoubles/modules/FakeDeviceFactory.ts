import { DeviceFactory } from '../../modules/BiosensorDeviceFactory'

export default class FakeDeviceFactory implements DeviceFactory {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeDeviceFactory.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeDeviceFactory.numCallsToConstructor = 0
    }
}
