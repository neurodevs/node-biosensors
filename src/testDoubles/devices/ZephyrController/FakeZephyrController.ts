import { DeviceController } from '../../../impl/BiosensorDeviceFactory.js'

export default class FakeZephyrDeviceController implements DeviceController {
    public static numCallsToConstructor = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor() {
        FakeZephyrDeviceController.numCallsToConstructor++
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
        this.numCallsToConstructor = 0
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}
