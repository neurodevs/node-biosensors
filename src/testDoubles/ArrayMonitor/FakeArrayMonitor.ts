import { DeviceStreamer } from 'impl/BiosensorDeviceFactory.js'
import { ArrayMonitor } from '../../impl/BiosensorArrayMonitor.js'

export default class FakeArrayMonitor implements ArrayMonitor {
    public static callsToConstructor: (DeviceStreamer[] | undefined)[] = []

    public static numCallsToActivate = 0

    public constructor(devices?: DeviceStreamer[]) {
        FakeArrayMonitor.callsToConstructor.push(devices ?? [])
    }

    public start() {
        FakeArrayMonitor.numCallsToActivate++
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToActivate = 0
    }
}
