import BiosensorDeviceFactory, {
    DeviceFactory,
    DeviceName,
} from './BiosensorDeviceFactory.js'

export default class BiosensorRuntimeOrchestrator
    implements RuntimeOrchestrator
{
    public static Class?: RuntimeOrchestratorConstructor

    private deviceNames: DeviceName[]
    private xdfRecordPath?: string
    private wssPortStart?: number

    private factory: DeviceFactory

    protected constructor(options: RuntimeOrchestratorConstructorOptions) {
        const { deviceNames, xdfRecordPath, wssPortStart, factory } = options

        this.deviceNames = deviceNames
        this.xdfRecordPath = xdfRecordPath
        this.wssPortStart = wssPortStart

        this.factory = factory
    }

    public static async Create(options: RuntimeOrchestratorOptions) {
        const { initializeOnCreate = true } = options

        const factory = this.BiosensorDeviceFactory()
        const instance = new (this.Class ?? this)({ ...options, factory })

        if (initializeOnCreate) {
            await instance.initialize()
        }

        return instance
    }

    public async initialize() {
        await this.factory.createDevices(this.deviceSpecifications, {
            xdfRecordPath: this.xdfRecordPath,
            wssPortStart: this.wssPortStart,
        })
    }

    private get deviceSpecifications() {
        return this.deviceNames.map((deviceName) => ({
            deviceName,
        }))
    }

    private static BiosensorDeviceFactory() {
        return BiosensorDeviceFactory.Create()
    }
}

export interface RuntimeOrchestrator {
    initialize(): Promise<void>
}

export type RuntimeOrchestratorConstructor = new (
    options: RuntimeOrchestratorOptions
) => RuntimeOrchestrator

export interface RuntimeOrchestratorOptions {
    deviceNames: DeviceName[]
    xdfRecordPath?: string
    wssPortStart?: number
    initializeOnCreate?: boolean
}

export interface RuntimeOrchestratorConstructorOptions
    extends RuntimeOrchestratorOptions {
    factory: DeviceFactory
}
