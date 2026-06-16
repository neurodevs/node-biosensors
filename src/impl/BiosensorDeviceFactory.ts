import {
    EventMarkerEmitter,
    LslEventMarkerEmitter,
    StreamOutlet,
} from '@neurodevs/node-lsl'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

import BiosensorWebSocketGateway, {
    WebSocketGateway,
} from './BiosensorWebSocketGateway.js'
import CgxDeviceController from './devices/CgxDeviceController.js'
import ZephyrDeviceController from './devices/ZephyrDeviceController.js'
import MuseDeviceController, {
    MuseControllerOptions,
} from './devices/MuseDeviceController.js'

export default class BiosensorDeviceFactory implements DeviceFactory {
    public static Class?: DeviceFactoryConstructor

    private spec!: CreateDeviceSpec
    private createdDevice!: DeviceController

    private deviceSpecs!: DeviceSpecification[]
    private createdBundles!: SingleDeviceBundle[]

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public async createDevice<K extends DeviceName>(
        deviceName: K,
        options?: PerDeviceOptionsMap[K] & SessionOptions
    ) {
        this.spec = { deviceName, options } as CreateDeviceSpec

        const { xdfRecordPath, webSocketPortStart, createEventMarkerEmitter } =
            options ?? {}

        this.createdDevice = await this.createDeviceByName()

        const bundle: SingleDeviceBundle = { device: this.createdDevice }

        if (xdfRecordPath) {
            bundle.recorder = await this.XdfStreamRecorder(
                xdfRecordPath,
                this.deviceStreamQueries
            )
        }

        if (webSocketPortStart) {
            bundle.gateway = await this.BiosensorWebSocketGateway(
                [this.createdDevice],
                webSocketPortStart
            )
        }

        if (createEventMarkerEmitter) {
            bundle.emitter = await this.LslEventMarkerEmitter()
        }

        return bundle
    }

    private async createDeviceByName() {
        switch (this.spec.deviceName) {
            case 'Cognionics Quick-20r':
                return this.CgxDeviceController()
            case 'Muse S Gen 2':
                return this.MuseDeviceController(this.spec.options)
            case 'Zephyr BioHarness 3':
                return this.ZephyrDeviceController()
            default:
                throw this.invalidNameError
        }
    }

    private get invalidNameError() {
        return new Error(this.invalidNameErrorMessage)
    }

    private get invalidNameErrorMessage() {
        return `\n\n Invalid device name: ${this.spec.deviceName}! \n\n Please choose from: \n\n - Cognionics Quick-20r \n - Muse S Gen 2 \n - Zephyr BioHarness 3 \n\n`
    }

    public async createDevices(
        deviceSpecifications: DeviceSpecification[],
        options?: SessionOptions
    ) {
        const { xdfRecordPath, webSocketPortStart, createEventMarkerEmitter } =
            options ?? {}

        this.deviceSpecs = deviceSpecifications
        this.createdBundles = await this.createAllDevices()

        const bundle: MultipleDeviceBundle = { devices: this.createdDevices }

        if (xdfRecordPath) {
            bundle.recorder = await this.XdfStreamRecorder(
                xdfRecordPath,
                this.allStreamQueries
            )
        }

        if (webSocketPortStart) {
            bundle.gateway = await this.BiosensorWebSocketGateway(
                this.createdDevices,
                webSocketPortStart
            )
        }

        if (createEventMarkerEmitter) {
            bundle.emitter = await this.LslEventMarkerEmitter()
        }

        return bundle
    }

    private async createAllDevices() {
        return await Promise.all(
            this.deviceSpecs.map((device) => {
                const { deviceName, options } = device
                return this.createDevice(deviceName, options)
            })
        )
    }

    private get createdDevices() {
        return this.createdBundles.map(({ device }) => device)
    }

    private get deviceStreamQueries() {
        return this.createdDevice.streamQueries
    }

    private get allStreamQueries() {
        return this.createdBundles.flatMap(({ device }) => device.streamQueries)
    }

    private async CgxDeviceController() {
        return CgxDeviceController.Create()
    }

    private async MuseDeviceController(options?: MuseControllerOptions) {
        const muse = await MuseDeviceController.Create(options)

        await muse.connect()

        return muse
    }

    private ZephyrDeviceController() {
        return ZephyrDeviceController.Create()
    }

    private XdfStreamRecorder(xdfRecordPath: string, streamQueries: string[]) {
        return XdfStreamRecorder.Create(xdfRecordPath, streamQueries)
    }

    private async BiosensorWebSocketGateway(
        devices: DeviceController[],
        webSocketPortStart: number
    ) {
        return BiosensorWebSocketGateway.Create(devices, {
            listenPortStart: webSocketPortStart,
        })
    }

    private async LslEventMarkerEmitter() {
        return LslEventMarkerEmitter.Create()
    }
}

export interface DeviceFactory {
    createDevice<K extends DeviceName>(
        deviceName: K,
        options?: PerDeviceOptionsMap[K] & SessionOptions
    ): Promise<SingleDeviceBundle>

    createDevices(
        deviceSpecifications: DeviceSpecification[],
        options?: SessionOptions
    ): Promise<MultipleDeviceBundle>
}

export type DeviceFactoryConstructor = new () => DeviceFactory

export interface DeviceController {
    connect(): Promise<void>
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
    readonly outlets: StreamOutlet[]
    readonly streamQueries: string[]
}

export interface DeviceControllerBle extends DeviceController {
    readonly bleUuid: string
    readonly bleName: string
}

export interface DeviceControllerOptions {
    xdfRecordPath?: string
}

export interface DeviceControllerBleOptions extends DeviceControllerOptions {
    bleUuid?: string
}

export type DeviceControllerConstructor = new (
    options?: DeviceControllerOptions
) => DeviceController

export type PerDeviceOptions = PerDeviceOptionsMap[DeviceName]

export interface PerDeviceOptionsMap {
    'Cognionics Quick-20r': DeviceControllerOptions
    'Muse S Gen 2': MuseControllerOptions
    'Zephyr BioHarness 3': DeviceControllerOptions
}

export type DeviceName =
    | 'Cognionics Quick-20r'
    | 'Muse S Gen 2'
    | 'Zephyr BioHarness 3'

export interface DeviceSpecification {
    deviceName: DeviceName
    options?: PerDeviceOptionsMap[DeviceName]
}

export type CreateDeviceSpec = {
    [K in DeviceName]: {
        deviceName: K
        options?: PerDeviceOptionsMap[K] & SessionOptions
    }
}[DeviceName]

export interface SessionOptions {
    xdfRecordPath?: string
    webSocketPortStart?: number
    createEventMarkerEmitter?: boolean
}

export interface SingleDeviceBundle {
    device: DeviceController
    recorder?: XdfRecorder
    gateway?: WebSocketGateway
    emitter?: EventMarkerEmitter
}

export interface MultipleDeviceBundle {
    devices: DeviceController[]
    recorder?: XdfRecorder
    gateway?: WebSocketGateway
    emitter?: EventMarkerEmitter
}
