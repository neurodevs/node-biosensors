import { generateId } from '@sprucelabs/test-utils'
import { FTDI_Device, FTDI_DeviceInfo } from 'ftdi-d2xx'

export default class FakeFTDI {
    public static numCallsToGetDeviceInfoList = 0
    public static callsToOpenDevice: string[] = []

    public static fakeDeviceInfos: FTDI_DeviceInfo[] = []

    public static setFakeDeviceInfos(numDevices = 1) {
        this.fakeDeviceInfos = Array.from({ length: numDevices }, () =>
            this.generateFakeDeviceInfo()
        )
    }

    private static generateFakeDeviceInfo() {
        return {
            serial_number: generateId(),
        } as FTDI_DeviceInfo
    }

    public static async getDeviceInfoList() {
        FakeFTDI.numCallsToGetDeviceInfoList++
        return this.fakeDeviceInfos
    }

    public static async openDevice(serialNumber: string) {
        FakeFTDI.callsToOpenDevice.push(serialNumber)
        return {} as FTDI_Device
    }

    public static resetTestDouble() {
        FakeFTDI.numCallsToGetDeviceInfoList = 0
        FakeFTDI.callsToOpenDevice = []
    }
}
