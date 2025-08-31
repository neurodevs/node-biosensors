import CgxDeviceStreamer from '../devices/CgxDeviceStreamer'
import MuseDeviceStreamer, {
    MuseDeviceStreamerOptions,
} from '../devices/MuseDeviceStreamer'
import ZephyrDeviceStreamer from '../devices/ZephyrDeviceStreamer'
import { DeviceStreamer } from '../types'

export default class BiosensorDeviceFactory {
    public static Class?: DeviceFactoryConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public async createDevice<K extends keyof DeviceOptionsMap>(
        name: K,
        options?: DeviceOptionsMap[K]
    ) {
        switch (name) {
            case 'Cognionics Quick-20r':
                return CgxDeviceStreamer.Create()
            case 'Muse S Gen 2':
                return MuseDeviceStreamer.Create(options)
            case 'Zephyr BioHarness 3':
                return ZephyrDeviceStreamer.Create()
            default:
                throw new Error()
        }
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
