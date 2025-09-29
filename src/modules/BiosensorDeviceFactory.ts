import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'
import { DeviceStreamer, DeviceStreamerOptions } from '../types'
import BiosensorArrayMonitor from './BiosensorArrayMonitor'
import CgxDeviceStreamer from './devices/CgxDeviceStreamer'
import MuseDeviceStreamer, {
    MuseDeviceStreamerOptions,
} from './devices/MuseDeviceStreamer'
import ZephyrDeviceStreamer from './devices/ZephyrDeviceStreamer'

export default class BiosensorDeviceFactory implements DeviceFactory {
    public static Class?: DeviceFactoryConstructor

    private deviceName!: DeviceName
    private deviceOptions?: DeviceOptionsMap[DeviceName]
    private createdDevice!: DeviceStreamer

    private deviceSpecifications!: DeviceSpecification[]
    private createdDevices!: DeviceStreamer[]

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public async createDevice<K extends keyof DeviceOptionsMap>(
        name: K,
        options?: DeviceOptionsMap[K] & { xdfRecordPath: string }
    ): Promise<[DeviceStreamer, XdfRecorder]>

    public async createDevice<K extends keyof DeviceOptionsMap>(
        name: K,
        options?: DeviceOptionsMap[K]
    ): Promise<DeviceStreamer>

    public async createDevice<K extends keyof DeviceOptionsMap>(
        name: K,
        options?: DeviceOptionsMap[K]
    ) {
        this.deviceName = name
        this.deviceOptions = options

        const { xdfRecordPath } = options ?? {}

        this.createdDevice = await this.createDeviceByName()

        if (xdfRecordPath) {
            const recorder = this.XdfStreamRecorder(
                xdfRecordPath,
                this.deviceStreamQueries
            )
            return [this.createdDevice, recorder]
        }

        return this.createdDevice
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
        return `\n\nInvalid device name: ${this.deviceName}!\n\nPlease choose from:\n\n- Cognionics Quick-20r\n- Muse S Gen 2\n- Zephyr BioHarness 3\n\n`
    }

    public async createDevices(
        devices: DeviceSpecification[],
        options?: CreateDevicesOptions & { xdfRecordPath: string }
    ): Promise<[DeviceStreamer[], XdfRecorder]>

    public async createDevices(
        devices: DeviceSpecification[],
        options?: CreateDevicesOptions
    ): Promise<DeviceStreamer[]>

    public async createDevices(
        devices: DeviceSpecification[],
        options?: CreateDevicesOptions
    ) {
        const { xdfRecordPath } = options ?? {}

        this.deviceSpecifications = devices
        this.createdDevices = await this.createAllDevices()

        if (xdfRecordPath) {
            const recorder = this.XdfStreamRecorder(
                xdfRecordPath,
                this.allStreamQueries
            )

            return [this.createdDevices, recorder]
        }

        BiosensorArrayMonitor.Create(this.createdDevices)

        return this.createdDevices
    }

    private async createAllDevices() {
        return await Promise.all(
            this.deviceSpecifications.map((device) =>
                this.createDevice(device.name, device.options)
            )
        )
    }

    private get deviceStreamQueries() {
        return this.createdDevice.streamQueries
    }

    private get allStreamQueries() {
        return this.createdDevices.flatMap((device) => device.streamQueries)
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
}

export interface DeviceFactory {
    createDevice<K extends DeviceName>(
        name: K,
        options: DeviceOptionsMap[K] & { xdfRecordPath: string }
    ): Promise<[DeviceStreamer, XdfRecorder]>

    createDevice<K extends DeviceName>(
        name: K,
        options?: DeviceOptionsMap[K]
    ): Promise<DeviceStreamer>

    createDevices(
        devices: DeviceSpecification[],
        options: CreateDevicesOptions & { xdfRecordPath: string }
    ): Promise<[DeviceStreamer[], XdfRecorder]>

    createDevices(
        devices: DeviceSpecification[],
        options?: CreateDevicesOptions
    ): Promise<DeviceStreamer[]>
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
