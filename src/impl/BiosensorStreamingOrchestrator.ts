import { EventMarkerOutlet, TimedEventMarker } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import BiosensorDeviceFactory, {
    DeviceFactory,
    DeviceSpecification,
} from './BiosensorDeviceFactory.js'
import { DeviceName, DeviceController } from './types.js'
import { WebSocketGateway } from './BiosensorWebSocketGateway.js'

export default class BiosensorStreamingOrchestrator implements StreamingOrchestrator {
    public static Class?: StreamingOrchestratorConstructor

    private devices: readonly (DeviceName | DeviceSpecification)[]
    private xdfRecordPath?: string
    private webSocketPortStart?: number
    private eventMarkers?: readonly TimedEventMarker[]

    private factory: DeviceFactory
    private recorder?: XdfRecorder
    private gateway?: WebSocketGateway
    private emitter?: EventMarkerOutlet

    private controllers: DeviceController[] = []

    protected constructor(options: StreamingOrchestratorConstructorOptions) {
        const {
            devices,
            xdfRecordPath,
            webSocketPortStart,
            eventMarkers,
            factory,
        } = options

        this.devices = devices
        this.xdfRecordPath = xdfRecordPath
        this.webSocketPortStart = webSocketPortStart
        this.eventMarkers = eventMarkers

        this.factory = factory
    }

    public static async Create(options: StreamingOrchestratorOptions) {
        const factory = this.BiosensorDeviceFactory()
        return new (this.Class ?? this)({ ...options, factory })
    }

    public async start() {
        await this.initialize()

        this.startXdfRecorderIfExists()
        this.openWebSocketGatewayIfExists()

        await this.startStreamingDevices()
    }

    private async initialize() {
        const { devices, recorder, gateway, emitter } =
            await this.createDeviceBundle()

        this.controllers = devices
        this.recorder = recorder
        this.gateway = gateway
        this.emitter = emitter
    }

    private async createDeviceBundle() {
        return await this.factory.createDevices(this.deviceSpecifications, {
            xdfRecordPath: this.xdfRecordPath,
            webSocketPortStart: this.webSocketPortStart,
            createEventMarkerEmitter: this.eventMarkers !== undefined,
        })
    }

    private get deviceSpecifications(): DeviceSpecification[] {
        return this.devices.map((device) =>
            typeof device === 'string' ? { deviceName: device } : device
        )
    }

    private startXdfRecorderIfExists() {
        this.recorder?.start()
    }

    private openWebSocketGatewayIfExists() {
        this.gateway?.open()
    }

    private startStreamingDevices() {
        return Promise.all(
            this.controllers.map((device) => device.startStreaming())
        )
    }

    public async stop() {
        await this.disconnectDevices()

        this.destroyEmitterIfExists()
        this.destroyGatewayIfExists()
        this.finishRecorderIfExists()
    }

    private async disconnectDevices() {
        return Promise.all(
            this.controllers.map((device) => device.disconnect())
        )
    }

    private destroyEmitterIfExists() {
        this.emitter?.destroy()
    }

    private destroyGatewayIfExists() {
        this.gateway?.destroy()
    }

    private finishRecorderIfExists() {
        this.recorder?.finish()
    }

    private static BiosensorDeviceFactory() {
        return BiosensorDeviceFactory.Create()
    }
}

export interface StreamingOrchestrator {
    start(): Promise<void>
    stop(): Promise<void>
}

export interface StreamingOrchestratorOptions {
    devices: readonly (DeviceName | DeviceSpecification)[]
    xdfRecordPath?: string
    webSocketPortStart?: number
    eventMarkers?: readonly TimedEventMarker[]
}

export type StreamingOrchestratorConstructor = new (
    options: StreamingOrchestratorConstructorOptions
) => StreamingOrchestrator

export interface StreamingOrchestratorConstructorOptions extends StreamingOrchestratorOptions {
    factory: DeviceFactory
}
