import { StreamOutlet } from '@neurodevs/node-lsl'
import { CytonController } from '../../impl/openbci/CytonDeviceController.js'

export default class FakeCytonController implements CytonController {
    public static numCallsToConstructor = 0
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconenct = 0

    public static fakeOutlets: StreamOutlet[] = []
    public static fakeStreamQueries: string[] = []

    public constructor() {
        FakeCytonController.numCallsToConstructor++
    }

    public async connect() {
        FakeCytonController.numCallsToConnect++
    }

    public async startStreaming() {
        FakeCytonController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeCytonController.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeCytonController.numCallsToDisconenct++
    }

    public get outlets() {
        return FakeCytonController.fakeOutlets
    }

    public get streamQueries() {
        return FakeCytonController.fakeStreamQueries
    }

    public static resetTestDouble() {
        FakeCytonController.numCallsToConstructor = 0
        FakeCytonController.numCallsToConnect = 0
        FakeCytonController.numCallsToStartStreaming = 0
        FakeCytonController.numCallsToStopStreaming = 0
        FakeCytonController.numCallsToDisconenct = 0
    }
}
