import BiosensorDeviceFactory, { DeviceName } from './BiosensorDeviceFactory.js'

export default class BiosensorRuntimeOrchestrator
    implements RuntimeOrchestrator
{
    public static Class?: RuntimeOrchestratorConstructor

    protected constructor(_options: RuntimeOrchestratorOptions) {}

    public static async Create(options: RuntimeOrchestratorOptions) {
        this.BiosensorDeviceFactory()
        return new (this.Class ?? this)(options)
    }

    private static BiosensorDeviceFactory() {
        BiosensorDeviceFactory.Create()
    }
}

export interface RuntimeOrchestrator {}

export type RuntimeOrchestratorConstructor = new (
    options: RuntimeOrchestratorOptions
) => RuntimeOrchestrator

export interface RuntimeOrchestratorOptions {
    deviceNames: DeviceName[]
}
