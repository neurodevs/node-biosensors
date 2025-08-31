import CgxDeviceStreamer from '../devices/CgxDeviceStreamer'
import MuseDeviceStreamer from '../devices/MuseDeviceStreamer'
import ZephyrDeviceStreamer from '../devices/ZephyrDeviceStreamer'
import { DeviceStreamer } from '../types'

export default class BiosensorDeviceFactory {
    public static Class?: DeviceFactoryConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public async createDevice(name: DeviceName) {
        switch (name) {
            case 'Cognionics Quick-20r':
                return CgxDeviceStreamer.Create()
            case 'Muse S Gen 2':
                return MuseDeviceStreamer.Create()
            case 'Zephyr BioHarness 3':
                return ZephyrDeviceStreamer.Create()
            default:
                throw new Error()
        }
    }
}

export interface DeviceFactory {
    createDevice(name: DeviceName): Promise<DeviceStreamer>
}

export type DeviceFactoryConstructor = new () => DeviceFactory

export type DeviceName =
    | 'Cognionics Quick-20r'
    | 'Muse S Gen 2'
    | 'Zephyr BioHarness 3'
