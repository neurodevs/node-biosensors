import { XdfRecorder } from '@neurodevs/node-xdf'

import BiosensorDeviceFactory, {
    DeviceFactory,
    DeviceName,
    DeviceStreamer,
} from './BiosensorDeviceFactory.js'
import { WebSocketGateway } from './BiosensorWebSocketGateway.js'

export default class BiosensorRuntimeOrchestrator implements RuntimeOrchestrator {
    public static Class?: RuntimeOrchestratorConstructor

    private deviceNames: DeviceName[]
    private xdfRecordPath?: string
    private webSocketPortStart?: number

    private factory: DeviceFactory
    private devices!: DeviceStreamer[]
    private recorder?: XdfRecorder
    private gateway?: WebSocketGateway

    protected constructor(options: RuntimeOrchestratorConstructorOptions) {
        const { deviceNames, xdfRecordPath, webSocketPortStart, factory } =
            options

        this.deviceNames = deviceNames
        this.xdfRecordPath = xdfRecordPath
        this.webSocketPortStart = webSocketPortStart

        this.factory = factory
    }

    public static async Create(options: RuntimeOrchestratorOptions) {
        const factory = this.BiosensorDeviceFactory()
        return new (this.Class ?? this)({ ...options, factory })
    }

    public async start() {
        await this.initialize()

        this.startXdfRecorderIfExists()
        this.openWebSocketGatewayIfExists()

        await this.startStreamingAllDevices()
    }

    private async initialize() {
        const { devices, recorder, gateway } = await this.createDeviceBundle()

        this.devices = devices
        this.recorder = recorder
        this.gateway = gateway
    }

    private async createDeviceBundle() {
        return await this.factory.createDevices(this.deviceSpecifications, {
            xdfRecordPath: this.xdfRecordPath,
            webSocketPortStart: this.webSocketPortStart,
        })
    }

    private get deviceSpecifications() {
        return this.deviceNames.map((deviceName) => ({
            deviceName,
        }))
    }

    private startXdfRecorderIfExists() {
        this.recorder?.start()
    }

    private openWebSocketGatewayIfExists() {
        this.gateway?.open()
    }

    private startStreamingAllDevices() {
        return Promise.all(
            this.devices.map((device) => device.startStreaming())
        )
    }

    public async stop() {
        await this.disconnectAllDevices()

        this.destroyWebSocketGatewayIfExists()
        this.stopXdfRecorderIfExists()
    }

    private async disconnectAllDevices() {
        return Promise.all(this.devices.map((device) => device.disconnect()))
    }

    private destroyWebSocketGatewayIfExists() {
        this.gateway?.destroy()
    }

    private stopXdfRecorderIfExists() {
        this.recorder?.stop()
    }

    private static BiosensorDeviceFactory() {
        return BiosensorDeviceFactory.Create()
    }
}

export interface RuntimeOrchestrator {
    start(): Promise<void>
    stop(): Promise<void>
}

export type RuntimeOrchestratorConstructor = new (
    options: RuntimeOrchestratorOptions
) => RuntimeOrchestrator

export interface RuntimeOrchestratorOptions {
    deviceNames: DeviceName[]
    xdfRecordPath?: string
    webSocketPortStart?: number
}

export interface RuntimeOrchestratorConstructorOptions extends RuntimeOrchestratorOptions {
    factory: DeviceFactory
}
