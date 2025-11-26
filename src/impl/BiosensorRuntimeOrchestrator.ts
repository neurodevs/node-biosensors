import { DeviceName } from './BiosensorDeviceFactory.js'

export default class BiosensorRuntimeOrchestrator
    implements RuntimeOrchestrator
{
    public static Class?: RuntimeOrchestratorConstructor

    protected constructor(_options: RuntimeOrchestratorOptions) {}

    public static async Create(options: RuntimeOrchestratorOptions) {
        return new (this.Class ?? this)(options)
    }
}

export interface RuntimeOrchestrator {}

export type RuntimeOrchestratorConstructor = new (
    options: RuntimeOrchestratorOptions
) => RuntimeOrchestrator

export interface RuntimeOrchestratorOptions {
    deviceNames: DeviceName[]
}
