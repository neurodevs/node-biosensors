import {
    StreamingOrchestrator,
    StreamingOrchestratorConstructorOptions,
} from '../../impl/BiosensorStreamingOrchestrator.js'

export default class FakeStreamingOrchestrator implements StreamingOrchestrator {
    public static callsToConstructor: (
        | StreamingOrchestratorConstructorOptions
        | undefined
    )[] = []

    public static numCallsToStart = 0
    public static numCallsToStop = 0

    public constructor(options?: StreamingOrchestratorConstructorOptions) {
        FakeStreamingOrchestrator.callsToConstructor.push(options)
    }

    public async start() {
        FakeStreamingOrchestrator.numCallsToStart += 1
    }

    public async stop() {
        FakeStreamingOrchestrator.numCallsToStop += 1
    }

    public static resetTestDouble() {
        FakeStreamingOrchestrator.callsToConstructor = []
        FakeStreamingOrchestrator.numCallsToStart = 0
        FakeStreamingOrchestrator.numCallsToStop = 0
    }
}
