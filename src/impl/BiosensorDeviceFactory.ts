import { EventMarkerOutlet, LslEventMarkerOutlet } from '@neurodevs/node-lsl'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

import BiosensorWebSocketGateway, {
    WebSocketGateway,
} from './BiosensorWebSocketGateway.js'
import CgxDeviceController from './cognionics/CgxDeviceController.js'
import GoveeDeviceController, {
    GoveeControllerOptions,
} from './govee/GoveeDeviceController.js'
import ZephyrDeviceController from './zephyr/ZephyrDeviceController.js'
import MuseDeviceController, {
    MuseControllerOptions,
    MuseDeviceModel,
} from './muse/MuseDeviceController.js'
import CytonDeviceController, {
    CytonControllerOptions,
} from './openbci/CytonDeviceController.js'
import {
    DEVICE_NAMES,
    DeviceController,
    DeviceControllerOptions,
    DeviceName,
} from './types.js'

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
        this.spec = { deviceName, options } satisfies CreateDeviceSpec

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
            bundle.emitter = await this.LslEventMarkerOutlet()
        }

        return bundle
    }

    private async createDeviceByName() {
        const { deviceName, options } = this.spec

        switch (deviceName) {
            case 'Cognionics Quick-20r':
                return this.CgxDeviceController()
            case 'Govee Thermohygrometer H5074':
                return this.GoveeDeviceController(options)
            case 'Muse S Athena':
            case 'Muse S Gen 2':
            case 'Muse S Gen 1':
            case 'Muse 2':
            case 'Muse 1 Gen 2':
                return this.MuseDeviceController(deviceName, options)
            case 'OpenBCI Cyton':
                return this.CytonDeviceController(options)
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
        const names = DEVICE_NAMES.map((name) => ` - ${name} `).join('\n')
        return `\n\n Invalid device name: ${this.spec.deviceName}! \n\n Please choose from: \n\n${names}\n\n`
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
            bundle.emitter = await this.LslEventMarkerOutlet()
        }

        return bundle
    }

    private async createAllDevices() {
        return await Promise.all(
            this.deviceSpecs.map((device) => {
                const { deviceName, ...options } = device
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
        return [
            ...new Set(
                this.createdBundles.flatMap(
                    ({ device }) => device.streamQueries
                )
            ),
        ]
    }

    private async CgxDeviceController() {
        return CgxDeviceController.Create()
    }

    private async GoveeDeviceController(
        options?: Partial<GoveeControllerOptions>
    ) {
        const { deviceUuid = '' } = options ?? {}
        return GoveeDeviceController.Create({ ...options, deviceUuid })
    }

    private CytonDeviceController(options?: CytonControllerOptions) {
        return CytonDeviceController.Create(options)
    }

    private async MuseDeviceController(
        model: MuseDeviceModel,
        options?: MuseControllerOptions
    ) {
        const muse = await MuseDeviceController.Create({ ...options, model })
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

    private async LslEventMarkerOutlet() {
        return LslEventMarkerOutlet.Create()
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

export type PerDeviceOptions = PerDeviceOptionsMap[DeviceName]

export interface PerDeviceOptionsMap extends Record<
    DeviceName,
    DeviceControllerOptions
> {
    'Cognionics Quick-20r': DeviceControllerOptions
    'Govee Thermohygrometer H5074': Partial<GoveeControllerOptions>
    'Muse S Athena': MuseControllerOptions
    'Muse S Gen 2': MuseControllerOptions
    'Muse S Gen 1': MuseControllerOptions
    'Muse 2': MuseControllerOptions
    'Muse 1 Gen 2': MuseControllerOptions
    'OpenBCI Cyton': CytonControllerOptions
    'Zephyr BioHarness 3': DeviceControllerOptions
}

export type DeviceSpecification = {
    [K in DeviceName]: { deviceName: K } & PerDeviceOptionsMap[K]
}[DeviceName]

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
    emitter?: EventMarkerOutlet
}

export interface MultipleDeviceBundle {
    devices: DeviceController[]
    recorder?: XdfRecorder
    gateway?: WebSocketGateway
    emitter?: EventMarkerOutlet
}
