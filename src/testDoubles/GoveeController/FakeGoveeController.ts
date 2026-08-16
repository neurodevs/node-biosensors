import { DeviceControllerBle } from '../../impl/BiosensorDeviceFactory.js'
import { GoveeControllerConstructorOptions } from '../../impl/govee/GoveeDeviceController.js'

export default class FakeGoveeController implements DeviceControllerBle {
    public static callsToConstructor: GoveeControllerConstructorOptions[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public constructor(options: GoveeControllerConstructorOptions) {
        FakeGoveeController.callsToConstructor.push(options)
    }

    public async connect() {
        FakeGoveeController.numCallsToConnect++
    }

    public async startStreaming() {
        FakeGoveeController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeGoveeController.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeGoveeController.numCallsToDisconnect++
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
