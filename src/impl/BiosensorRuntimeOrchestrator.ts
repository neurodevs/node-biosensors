import { XdfRecorder } from '@neurodevs/node-xdf'
import BiosensorDeviceFactory, {
    DeviceFactory,
    DeviceName,
    DeviceStreamer,
} from './BiosensorDeviceFactory.js'
import { WebSocketGateway } from './BiosensorWebSocketGateway.js'

export default class BiosensorRuntimeOrchestrator
    implements RuntimeOrchestrator
{
    public static Class?: RuntimeOrchestratorConstructor

    private deviceNames: DeviceName[]
    private xdfRecordPath?: string
    private wssPortStart?: number

    private factory: DeviceFactory
    private devices!: DeviceStreamer[]
    private recorder?: XdfRecorder
    private gateway?: WebSocketGateway

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
        const { devices, recorder, gateway } = await this.createDeviceBundle()

        this.devices = devices
        this.recorder = recorder
        this.gateway = gateway
    }

    private async createDeviceBundle() {
        return await this.factory.createDevices(this.deviceSpecifications, {
            xdfRecordPath: this.xdfRecordPath,
            wssPortStart: this.wssPortStart,
        })
    }

    private get deviceSpecifications() {
        return this.deviceNames.map((deviceName) => ({
            deviceName,
        }))
    }

    public async start() {
        this.startXdfRecorderIfEnabled()
        this.openWebSocketGatewayIfEnabled()

        await this.startStreamingAllDevices()
    }

    private startXdfRecorderIfEnabled() {
        this.recorder?.start()
    }

    private openWebSocketGatewayIfEnabled() {
        this.gateway?.open()
    }

    private startStreamingAllDevices() {
        return Promise.all(
            this.devices.map((device) => device.startStreaming())
        )
    }

    private static BiosensorDeviceFactory() {
        return BiosensorDeviceFactory.Create()
    }
}

export interface RuntimeOrchestrator {
    initialize(): Promise<void>
    start(): Promise<void>
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
