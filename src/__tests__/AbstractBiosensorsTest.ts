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
import CgxStreamProducer from '../modules/Cgx/CgxStreamProducer'
import MuseStreamProducer from '../modules/Muse/MuseStreamProducer'
import SpyCgxProducer from '../testDoubles/CgxProducer/SpyCgxProducer'
import FakeDeviceFTDI from '../testDoubles/FTDI/FakeDeviceFTDI'
import FakeFTDI from '../testDoubles/FTDI/FakeFTDI'
import FakeMuseProducer from '../testDoubles/MuseProducer/FakeMuseProducer'
import SpyMuseProducer from '../testDoubles/MuseProducer/SpyMuseProducer'

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
        CgxStreamProducer.FTDI = FakeFTDI as any
        FakeFTDI.resetTestDouble()
        FakeDeviceFTDI.resetTestDouble()

        FakeFTDI.setFakeDeviceInfos()
    }

    protected static setFakeLslOutlet() {
        LslStreamOutlet.Class = FakeLslOutlet
        FakeLslOutlet.resetTestDouble()
    }

    protected static setFakeMuseProducer() {
        MuseStreamProducer.Class = FakeMuseProducer
        FakeMuseProducer.resetTestDouble()
    }

    protected static setFakeStreamInfo() {
        LslStreamInfo.Class = FakeStreamInfo
        FakeStreamInfo.resetTestDouble()
    }

    protected static setFakeXdfRecorder() {
        XdfStreamRecorder.Class = FakeXdfRecorder
        FakeXdfRecorder.resetTestDouble()
    }

    protected static setSpyMuseProducer() {
        MuseStreamProducer.Class = SpyMuseProducer
    }

    protected static setSpyCgxProducer() {
        CgxStreamProducer.Class = SpyCgxProducer
    }

    protected static FakeCharacteristic(uuid: string) {
        return new FakeCharacteristic({ uuid })
    }

    protected static FakePeripheral(options?: PeripheralOptions) {
        return new FakePeripheral(options)
    }
}
