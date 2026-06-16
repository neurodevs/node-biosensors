import { BleController } from '@neurodevs/node-lsl'
import {
    DeviceController,
    DeviceControllerOptions,
} from '../../../impl/BiosensorDeviceFactory.js'

export default class FakeZephyrDeviceController implements DeviceController {
    public static callsToConstructor: (DeviceControllerOptions | undefined)[] =
        []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor(_ble: BleController, options?: DeviceControllerOptions) {
        FakeZephyrDeviceController.callsToConstructor.push(options)
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

    public static resetTestDouble() {
        this.callsToConstructor.length = 0
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}
