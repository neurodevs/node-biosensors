import AbstractSpruceTest from '@sprucelabs/test-utils'
import {
    BleDeviceController,
    FakeBleController,
    BleDeviceScanner,
    FakeBleScanner,
    FakePeripheral,
    PeripheralOptions,
    FakeCharacteristic,
    BleDeviceConnector,
    FakeBleConnector,
} from '@neurodevs/node-ble'
import {
    LslStreamOutlet,
    FakeLslOutlet,
    LslStreamInfo,
    FakeStreamInfo,
    LslStreamInlet,
    FakeLslInlet,
} from '@neurodevs/node-lsl'
import { XdfStreamRecorder, FakeXdfRecorder } from '@neurodevs/node-xdf'
import CgxDeviceStreamer from '../modules/devices/CgxDeviceStreamer'
import MuseDeviceStreamer from '../modules/devices/MuseDeviceStreamer'
import ZephyrDeviceStreamer from '../modules/devices/ZephyrDeviceStreamer'
import FakeCgxDeviceStreamer from '../testDoubles/DeviceStreamer/CgxDeviceStreamer/FakeCgxDeviceStreamer'
import SpyCgxDeviceStreamer from '../testDoubles/DeviceStreamer/CgxDeviceStreamer/SpyCgxDeviceStreamer'
import FakeDeviceStreamer from '../testDoubles/DeviceStreamer/FakeDeviceStreamer'
import FakeMuseDeviceStreamer from '../testDoubles/DeviceStreamer/MuseDeviceStreamer/FakeMuseDeviceStreamer'
import SpyMuseDeviceStreamer from '../testDoubles/DeviceStreamer/MuseDeviceStreamer/SpyMuseDeviceStreamer'
import FakeZephyrDeviceStreamer from '../testDoubles/DeviceStreamer/ZephyrDeviceStreamer/FakeZephyrDeviceStreamer'
import FakeDeviceFTDI from '../testDoubles/FTDI/FakeDeviceFTDI'
import FakeFTDI from '../testDoubles/FTDI/FakeFTDI'
import { DeviceStreamerOptions } from '../types'

export default class AbstractPackageTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeBleController()
        this.setFakeBleConnector()
        this.setFakeBleScanner()
        this.setFakeFTDI()
        this.setFakeLslInlet()
        this.setFakeLslOutlet()
        this.setFakeStreamInfo()
        this.setFakeXdfRecorder()
    }

    protected static setFakeDevices() {
        this.setFakeCgxDeviceStreamer()
        this.setFakeMuseDeviceStreamer()
        this.setFakeZephyrDeviceStreamer()
    }

    protected static setFakeBleController() {
        BleDeviceController.Class = FakeBleController
        FakeBleController.resetTestDouble()
    }

    protected static setFakeBleConnector() {
        BleDeviceConnector.Class = FakeBleConnector
        FakeBleConnector.resetTestDouble()
    }

    protected static setFakeBleScanner() {
        BleDeviceScanner.Class = FakeBleScanner
        FakeBleScanner.resetTestDouble()
    }

    protected static setFakeCgxDeviceStreamer() {
        CgxDeviceStreamer.Class = FakeCgxDeviceStreamer
        FakeCgxDeviceStreamer.resetTestDouble()
    }

    protected static setFakeFTDI() {
        CgxDeviceStreamer.FTDI = FakeFTDI as any
        FakeFTDI.resetTestDouble()
        FakeDeviceFTDI.resetTestDouble()

        FakeFTDI.setFakeDeviceInfos()
    }

    protected static setFakeLslInlet() {
        LslStreamInlet.Class = FakeLslInlet
        FakeLslInlet.resetTestDouble()
    }

    protected static setFakeLslOutlet() {
        LslStreamOutlet.Class = FakeLslOutlet
        FakeLslOutlet.resetTestDouble()
    }

    protected static setFakeMuseDeviceStreamer() {
        MuseDeviceStreamer.Class = FakeMuseDeviceStreamer
        FakeMuseDeviceStreamer.resetTestDouble()
    }

    protected static setFakeStreamInfo() {
        LslStreamInfo.Class = FakeStreamInfo
        FakeStreamInfo.resetTestDouble()
    }

    protected static setFakeXdfRecorder() {
        XdfStreamRecorder.Class = FakeXdfRecorder
        FakeXdfRecorder.resetTestDouble()
    }

    protected static setFakeZephyrDeviceStreamer() {
        ZephyrDeviceStreamer.Class = FakeZephyrDeviceStreamer
        FakeZephyrDeviceStreamer.resetTestDouble()
    }

    protected static setSpyCgxDeviceStreamer() {
        CgxDeviceStreamer.Class = SpyCgxDeviceStreamer
    }

    protected static setSpyMuseDeviceStreamer() {
        MuseDeviceStreamer.Class = SpyMuseDeviceStreamer
    }

    protected static FakeCharacteristic(uuid: string) {
        return new FakeCharacteristic({ uuid })
    }

    protected static FakeDeviceStreamer(options?: DeviceStreamerOptions) {
        return new FakeDeviceStreamer(options)
    }

    protected static FakePeripheral(options?: PeripheralOptions) {
        return new FakePeripheral(options)
    }
}
