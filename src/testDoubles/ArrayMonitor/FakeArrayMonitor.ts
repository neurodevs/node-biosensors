import { DeviceStreamer } from 'impl/BiosensorDeviceFactory.js'
import { ArrayMonitor } from '../../impl/BiosensorArrayMonitor.js'

export default class FakeArrayMonitor implements ArrayMonitor {
    public static callsToConstructor: (DeviceStreamer[] | undefined)[] = []

    public static numCallsToStart = 0
    public static numCallsToStop = 0

    public constructor(devices?: DeviceStreamer[]) {
        FakeArrayMonitor.callsToConstructor.push(devices ?? [])
    }

    public start() {
        FakeArrayMonitor.numCallsToStart++
    }

    public stop() {
        FakeArrayMonitor.numCallsToStop++
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToStart = 0
        this.numCallsToStop = 0
    }
}
