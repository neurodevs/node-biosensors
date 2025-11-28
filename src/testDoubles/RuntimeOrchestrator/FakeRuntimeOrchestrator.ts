import {
    RuntimeOrchestrator,
    RuntimeOrchestratorOptions,
} from '../../impl/BiosensorRuntimeOrchestrator.js'

export default class FakeRuntimeOrchestrator implements RuntimeOrchestrator {
    public static callsToConstructor: (
        | RuntimeOrchestratorOptions
        | undefined
    )[] = []

    public static numCallsToInitialize = 0
    public static numCallsToStart = 0

    public constructor(options?: RuntimeOrchestratorOptions) {
        FakeRuntimeOrchestrator.callsToConstructor.push(options)
    }

    public async initialize() {
        FakeRuntimeOrchestrator.numCallsToInitialize += 1
    }

    public async start() {
        FakeRuntimeOrchestrator.numCallsToStart += 1
    }

    public static resetTestDouble() {
        FakeRuntimeOrchestrator.callsToConstructor = []
        FakeRuntimeOrchestrator.numCallsToInitialize = 0
        FakeRuntimeOrchestrator.numCallsToStart = 0
    }
}
