import { EventMarkerEmitter, TimedEventMarker } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import BiosensorDeviceFactory, {
    DeviceFactory,
    DeviceName,
    DeviceStreamer,
} from './BiosensorDeviceFactory.js'
import { WebSocketGateway } from './BiosensorWebSocketGateway.js'

export default class BiosensorStreamingOrchestrator implements StreamingOrchestrator {
    public static Class?: StreamingOrchestratorConstructor

    private deviceNames: DeviceName[]
    private xdfRecordPath?: string
    private webSocketPortStart?: number
    private eventMarkers?: TimedEventMarker[]

    private factory: DeviceFactory
    private devices!: DeviceStreamer[]
    private recorder?: XdfRecorder
    private gateway!: WebSocketGateway
    private emitter?: EventMarkerEmitter

    protected constructor(options: StreamingOrchestratorConstructorOptions) {
        const {
            deviceNames,
            xdfRecordPath,
            webSocketPortStart = 8080,
            eventMarkers,
            factory,
        } = options

        this.deviceNames = deviceNames
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
        this.openWebSocketGateway()

        await this.startStreamingAllDevices()
    }

    private async initialize() {
        const { devices, recorder, gateway, emitter } =
            await this.createDeviceBundle()

        this.devices = devices
        this.recorder = recorder
        this.gateway = gateway!
        this.emitter = emitter
    }

    private async createDeviceBundle() {
        return await this.factory.createDevices(this.deviceSpecifications, {
            xdfRecordPath: this.xdfRecordPath,
            webSocketPortStart: this.webSocketPortStart,
            createEventMarkerEmitter: this.eventMarkers !== undefined,
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

    private openWebSocketGateway() {
        this.gateway.open()
    }

    private startStreamingAllDevices() {
        return Promise.all(
            this.devices.map((device) => device.startStreaming())
        )
    }

    public async stop() {
        await this.disconnectAllDevices()

        this.destroyEventMarkerEmitter()
        this.destroyWebSocketGateway()
        this.stopXdfRecorderIfExists()
    }

    private async disconnectAllDevices() {
        return Promise.all(this.devices.map((device) => device.disconnect()))
    }

    private destroyEventMarkerEmitter() {
        this.emitter?.destroy()
    }

    private destroyWebSocketGateway() {
        this.gateway?.destroy()
    }

    private stopXdfRecorderIfExists() {
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

export type StreamingOrchestratorConstructor = new (
    options: StreamingOrchestratorConstructorOptions
) => StreamingOrchestrator

export interface StreamingOrchestratorOptions {
    deviceNames: DeviceName[]
    xdfRecordPath?: string
    webSocketPortStart?: number
    eventMarkers?: TimedEventMarker[]
}

export interface StreamingOrchestratorConstructorOptions extends StreamingOrchestratorOptions {
    factory: DeviceFactory
}
