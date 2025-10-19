import { DeviceStreamer } from 'impl/BiosensorDeviceFactory'
import { ArrayMonitor } from '../../impl/BiosensorArrayMonitor'

export default class FakeArrayMonitor implements ArrayMonitor {
    public static callsToConstructor: (DeviceStreamer[] | undefined)[] = []

    public constructor(devices?: DeviceStreamer[]) {
        FakeArrayMonitor.callsToConstructor.push(devices ?? [])
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
    }
}
