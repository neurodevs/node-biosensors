import { FTDI_Device } from 'ftdi-d2xx'

export default class FakeFTDI {
    public static numCallsToGetDeviceInfoList = 0

    public static fakeDevices: FTDI_Device[] = []

    public static async getDeviceInfoList() {
        FakeFTDI.numCallsToGetDeviceInfoList++
        return this.fakeDevices
    }

    public static resetTestDouble() {
        FakeFTDI.numCallsToGetDeviceInfoList = 0
    }
}
