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
} from '@neurodevs/node-lsl'
import { XdfStreamRecorder, FakeXdfRecorder } from '@neurodevs/node-xdf'
import CgxDeviceStreamer from '../modules/CgxDeviceStreamer'
import MuseDeviceStreamer from '../modules/MuseDeviceStreamer'
import FakeMuseDeviceStreamer from '../testDoubles/FakeMuseDeviceStreamer'
import FakeDeviceFTDI from '../testDoubles/FTDI/FakeDeviceFTDI'
import FakeFTDI from '../testDoubles/FTDI/FakeFTDI'
import SpyCgxDeviceStreamer from '../testDoubles/SpyCgxDeviceStreamer'
import SpyMuseDeviceStreamer from '../testDoubles/SpyMuseDeviceStreamer'

export default class AbstractBiosensorsTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeBleController()
        this.setFakeBleConnector()
        this.setFakeBleScanner()
        this.setFakeFTDI()
        this.setFakeLslOutlet()
        this.setFakeStreamInfo()
        this.setFakeXdfRecorder()
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

    protected static setFakeFTDI() {
        CgxDeviceStreamer.FTDI = FakeFTDI as any
        FakeFTDI.resetTestDouble()
        FakeDeviceFTDI.resetTestDouble()

        FakeFTDI.setFakeDeviceInfos()
    }

    protected static setFakeLslOutlet() {
        LslStreamOutlet.Class = FakeLslOutlet
        FakeLslOutlet.resetTestDouble()
    }

    protected static setFakeDeviceStreamer() {
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

    protected static setSpyMuseDeviceStreamer() {
        MuseDeviceStreamer.Class = SpyMuseDeviceStreamer
    }

    protected static setSpyCgxDeviceStreamer() {
        CgxDeviceStreamer.Class = SpyCgxDeviceStreamer
    }

    protected static FakeCharacteristic(uuid: string) {
        return new FakeCharacteristic({ uuid })
    }

    protected static FakePeripheral(options?: PeripheralOptions) {
        return new FakePeripheral(options)
    }
}
