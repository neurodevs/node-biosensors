import CgxDeviceStreamer from '../devices/CgxDeviceStreamer'
import MuseDeviceStreamer, {
    MuseDeviceStreamerOptions,
} from '../devices/MuseDeviceStreamer'
import ZephyrDeviceStreamer from '../devices/ZephyrDeviceStreamer'
import { DeviceStreamer } from '../types'

export default class BiosensorDeviceFactory {
    public static Class?: DeviceFactoryConstructor

    private currentName!: DeviceName
    private currentOptions?: DeviceOptionsMap[DeviceName]

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
                throw new Error(this.invalidNameError)
        }
    }

    private get invalidNameError() {
        return `\n\nInvalid device name: ${this.currentName}!\n\nPlease choose from:\n\n- Cognionics Quick-20r\n- Muse S Gen 2\n- Zephyr BioHarness 3\n\n`
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
}

export interface DeviceFactory {
    createDevice<K extends keyof DeviceOptionsMap>(
        name: K,
        options?: DeviceOptionsMap[K]
    ): Promise<DeviceStreamer>
}

export type DeviceFactoryConstructor = new () => DeviceFactory

export type DeviceName =
    | 'Cognionics Quick-20r'
    | 'Muse S Gen 2'
    | 'Zephyr BioHarness 3'

export interface DeviceOptionsMap {
    'Cognionics Quick-20r': never
    'Muse S Gen 2': MuseDeviceStreamerOptions
    'Zephyr BioHarness 3': never
}
