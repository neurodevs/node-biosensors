import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'
import { DeviceStreamer, DeviceStreamerOptions } from '../types'
import CgxDeviceStreamer from './devices/CgxDeviceStreamer'
import MuseDeviceStreamer, {
    MuseDeviceStreamerOptions,
} from './devices/MuseDeviceStreamer'
import ZephyrDeviceStreamer from './devices/ZephyrDeviceStreamer'

export default class BiosensorDeviceFactory implements DeviceFactory {
    public static Class?: DeviceFactoryConstructor

    private currentName!: DeviceName
    private currentOptions?: DeviceOptionsMap[DeviceName]

    private currentDevices!: DeviceSpecification[]
    private currentXdfRecordPath?: string
    private createdDevices!: DeviceStreamer[]
    private createdRecorder?: XdfRecorder

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public async createDevice<K extends keyof DeviceOptionsMap>(
        name: K,
        options?: DeviceOptionsMap[K]
    ) {
        this.currentName = name
        this.currentOptions = options

        return this.createDeviceByName()
    }

    private createDeviceByName() {
        switch (this.currentName) {
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
        return `\n\nInvalid device name: ${this.currentName}!\n\nPlease choose from:\n\n- Cognionics Quick-20r\n- Muse S Gen 2\n- Zephyr BioHarness 3\n\n`
    }

    public async createDevices(
        devices: DeviceSpecification[],
        options?: CreateDevicesOptions
    ): Promise<StreamersAndRecorderTuple> {
        const { xdfRecordPath } = options ?? {}

        this.currentDevices = devices
        this.currentXdfRecordPath = xdfRecordPath

        this.createdDevices = await this.createAllDevices()
        this.createdRecorder = this.createXdfRecorderIfPath()

        return [this.createdDevices, this.createdRecorder]
    }

    private async createAllDevices() {
        return await Promise.all(
            this.currentDevices.map((device) =>
                this.createDevice(device.name, device.options)
            )
        )
    }

    private createXdfRecorderIfPath() {
        return this.currentXdfRecordPath ? this.XdfStreamRecorder() : undefined
    }

    private get allStreamQueries() {
        return this.createdDevices.flatMap((device) => device.streamQueries)
    }

    private CgxDeviceStreamer() {
        return CgxDeviceStreamer.Create()
    }

    private MuseDeviceStreamer() {
        return MuseDeviceStreamer.Create(this.currentOptions)
    }

    private ZephyrDeviceStreamer() {
        return ZephyrDeviceStreamer.Create()
    }

    private XdfStreamRecorder() {
        return XdfStreamRecorder.Create(
            this.currentXdfRecordPath!,
            this.allStreamQueries
        )
    }
}

export interface DeviceFactory {
    createDevice<K extends DeviceName>(
        name: K,
        options?: DeviceOptionsMap[K]
    ): Promise<DeviceStreamer>

    createDevices(
        devices: DeviceSpecification[],
        options?: CreateDevicesOptions
    ): Promise<StreamersAndRecorderTuple>
}

export type DeviceFactoryConstructor = new () => DeviceFactory

export interface CreateDevicesOptions {
    xdfRecordPath?: string
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
    name: DeviceName
    options?: DeviceOptionsMap[DeviceName]
}

export type StreamersAndRecorderTuple = [
    DeviceStreamer[],
    XdfRecorder | undefined,
]
