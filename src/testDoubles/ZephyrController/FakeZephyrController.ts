import { BleGatt } from '@neurodevs/node-lsl'
import { DeviceControllerBle } from '../../impl/types.js'
import { XdfRecorder } from '@neurodevs/node-xdf'

export default class FakeZephyrDeviceController implements DeviceControllerBle {
    public static callsToConstructor: {
        ble: BleGatt
        recorder?: XdfRecorder
    }[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor(ble: BleGatt, recorder?: XdfRecorder) {
        FakeZephyrDeviceController.callsToConstructor.push({ ble, recorder })
    }

    public async connect() {
        FakeZephyrDeviceController.numCallsToConnect++
    }

    public async startStreaming() {
        FakeZephyrDeviceController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeZephyrDeviceController.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeZephyrDeviceController.numCallsToDisconnect++
    }

    public get outlets() {
        return []
    }

    public streamQueries = []

    public get bleUuid() {
        return ''
    }

    public get bleName() {
        return ''
    }

    public static resetTestDouble() {
        this.callsToConstructor.length = 0
        this.numCallsToConnect = 0
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}
