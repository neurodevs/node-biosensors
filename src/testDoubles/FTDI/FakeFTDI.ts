import { FTDI_Device } from 'ftdi-d2xx'

export default class FakeFTDI {
    public static numCallsToGetDeviceInfoList = 0

    public static async getDeviceInfoList() {
        FakeFTDI.numCallsToGetDeviceInfoList++
        return [] as FTDI_Device[]
    }

    public static resetTestDouble() {
        FakeFTDI.numCallsToGetDeviceInfoList = 0
    }
}
