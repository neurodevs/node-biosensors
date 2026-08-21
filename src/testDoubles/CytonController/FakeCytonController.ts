import { LslOutlet } from '@neurodevs/node-lsl'
import {
    CytonController,
    CytonControllerConstructorOptions,
} from '../../impl/openbci/CytonDeviceController.js'

export default class FakeCytonController implements CytonController {
    public static callsToConstructor: CytonControllerConstructorOptions[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconenct = 0

    public static fakeOutlets: LslOutlet[] = []
    public static fakeStreamQueries: string[] = []

    public constructor(options: CytonControllerConstructorOptions) {
        FakeCytonController.callsToConstructor.push(options)
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
        FakeCytonController.callsToConstructor = []
        FakeCytonController.numCallsToConnect = 0
        FakeCytonController.numCallsToStartStreaming = 0
        FakeCytonController.numCallsToStopStreaming = 0
        FakeCytonController.numCallsToDisconenct = 0
    }
}
