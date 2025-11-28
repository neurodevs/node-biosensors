import {
    RuntimeOrchestrator,
    RuntimeOrchestratorOptions,
} from '../../impl/BiosensorRuntimeOrchestrator.js'

export default class FakeRuntimeOrchestrator implements RuntimeOrchestrator {
    public static callsToConstructor: (
        | RuntimeOrchestratorOptions
        | undefined
    )[] = []

    public static numCallsToStart = 0

    public constructor(options?: RuntimeOrchestratorOptions) {
        FakeRuntimeOrchestrator.callsToConstructor.push(options)
    }

    public async start() {
        FakeRuntimeOrchestrator.numCallsToStart += 1
    }

    public static resetTestDouble() {
        FakeRuntimeOrchestrator.callsToConstructor = []
        FakeRuntimeOrchestrator.numCallsToStart = 0
    }
}
