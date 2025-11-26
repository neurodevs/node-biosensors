import {
    RuntimeOrchestrator,
    RuntimeOrchestratorOptions,
} from '../../impl/BiosensorRuntimeOrchestrator.js'

export default class FakeRuntimeOrchestrator implements RuntimeOrchestrator {
    public static callsToConstructor: (
        | RuntimeOrchestratorOptions
        | undefined
    )[] = []

    public constructor(options?: RuntimeOrchestratorOptions) {
        FakeRuntimeOrchestrator.callsToConstructor.push(options)
    }

    public static resetTestDouble() {
        FakeRuntimeOrchestrator.callsToConstructor = []
    }
}
