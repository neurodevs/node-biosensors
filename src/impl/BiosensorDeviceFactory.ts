import { StreamOutlet } from '@neurodevs/node-lsl'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

import BiosensorWebSocketGateway, {
    WebSocketGateway,
} from './BiosensorWebSocketGateway.js'
import CgxDeviceStreamer from './devices/CgxDeviceStreamer.js'
import MuseDeviceStreamer, {
    MuseDeviceStreamerOptions,
} from './devices/MuseDeviceStreamer.js'
import ZephyrDeviceStreamer from './devices/ZephyrDeviceStreamer.js'

export default class BiosensorDeviceFactory implements DeviceFactory {
    public static Class?: DeviceFactoryConstructor

    private deviceName!: DeviceName
    private deviceOptions?: DeviceOptionsMap[DeviceName]
    private createdDevice!: DeviceStreamer

    private deviceSpecifications!: DeviceSpecification[]
    private createdBundles!: SingleDeviceBundle[]

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public async createDevice<K extends DeviceName>(
        deviceName: K,
        options?: DeviceOptionsMap[K]
    ) {
        this.deviceName = deviceName
        this.deviceOptions = options

        const { xdfRecordPath } = options ?? {}

        this.createdDevice = await this.createDeviceByName()

        const bundle: SingleDeviceBundle = { device: this.createdDevice }

        if (xdfRecordPath) {
            bundle.recorder = this.XdfStreamRecorder(
                xdfRecordPath,
                this.deviceStreamQueries
            )
        }

        return bundle
    }

    private async createDeviceByName() {
        switch (this.deviceName) {
            case 'Cognionics Quick-20r':
                return this.CgxDeviceStreamer()
            case 'Muse S Gen 2':
                return this.MuseDeviceStreamer()
            case 'Zephyr BioHarness 3':
                return this.ZephyrDeviceStreamer()
            default:
                throw this.invalidNameError
        }
    }

    private get invalidNameError() {
        return new Error(this.invalidNameErrorMessage)
    }

    private get invalidNameErrorMessage() {
        return `\n\n Invalid device name: ${this.deviceName}! \n\n Please choose from: \n\n - Cognionics Quick-20r \n - Muse S Gen 2 \n - Zephyr BioHarness 3 \n\n`
    }

    public async createDevices(
        deviceSpecifications: DeviceSpecification[],
        options?: DeviceOptions
    ) {
        const { xdfRecordPath, wssPortStart } = options ?? {}

        this.deviceSpecifications = deviceSpecifications
        this.createdBundles = await this.createAllDevices()

        const bundle: MultipleDeviceBundle = { devices: this.createdDevices }

        if (xdfRecordPath) {
            bundle.recorder = this.XdfStreamRecorder(
                xdfRecordPath,
                this.allStreamQueries
            )
        }

        if (wssPortStart) {
            bundle.gateway = this.BiosensorWebSocketGateway(wssPortStart)
        }

        return bundle
    }

    private async createAllDevices() {
        return await Promise.all(
            this.deviceSpecifications.map((device) => {
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

    private CgxDeviceStreamer() {
        return CgxDeviceStreamer.Create()
    }

    private MuseDeviceStreamer() {
        return MuseDeviceStreamer.Create(this.deviceOptions)
    }

    private ZephyrDeviceStreamer() {
        return ZephyrDeviceStreamer.Create()
    }

    private XdfStreamRecorder(xdfRecordPath: string, streamQueries: string[]) {
        return XdfStreamRecorder.Create(xdfRecordPath, streamQueries)
    }

    private BiosensorWebSocketGateway(wssPortStart: number) {
        return BiosensorWebSocketGateway.Create(this.createdDevices, {
            wssPortStart,
        })
    }
}

export interface DeviceFactory {
    createDevice<K extends DeviceName>(
        deviceName: K,
        options?: DeviceOptionsMap[K]
    ): Promise<SingleDeviceBundle>

    createDevices(
        deviceSpecifications: DeviceSpecification[],
        options?: DeviceOptions
    ): Promise<MultipleDeviceBundle>
}

export type DeviceFactoryConstructor = new () => DeviceFactory

export interface DeviceStreamer {
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
    readonly outlets: StreamOutlet[]
    readonly streamQueries: string[]
}

export interface DeviceStreamerOptions {
    xdfRecordPath?: string
    wssPortStart?: number
}

export type DeviceName =
    | 'Cognionics Quick-20r'
    | 'Muse S Gen 2'
    | 'Zephyr BioHarness 3'

export type DeviceOptions = DeviceOptionsMap[DeviceName]

export interface DeviceOptionsMap {
    'Cognionics Quick-20r': DeviceStreamerOptions
    'Muse S Gen 2': MuseDeviceStreamerOptions
    'Zephyr BioHarness 3': DeviceStreamerOptions
}

export interface DeviceSpecification {
    deviceName: DeviceName
    options?: DeviceOptionsMap[DeviceName]
}

export interface SingleDeviceBundle {
    device: DeviceStreamer
    recorder?: XdfRecorder
}

export interface MultipleDeviceBundle {
    devices: DeviceStreamer[]
    recorder?: XdfRecorder
    gateway?: WebSocketGateway
}
