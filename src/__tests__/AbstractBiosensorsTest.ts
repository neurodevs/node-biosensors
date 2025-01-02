import AbstractSpruceTest from '@sprucelabs/test-utils'
import {
    BleDeviceAdapter,
    FakeBleAdapter,
    BleDeviceScanner,
    FakeBleScanner,
    FakePeripheral,
    PeripheralOptions,
} from '@neurodevs/node-ble'
import {
    LslStreamOutlet,
    FakeLslOutlet,
    LslStreamInfo,
    FakeStreamInfo,
} from '@neurodevs/node-lsl'
import { XdfStreamRecorder, FakeXdfRecorder } from '@neurodevs/node-xdf'
import MuseStreamProducer from '../components/MuseSGen2/MuseStreamProducer'
import MuseStreamRecorder from '../components/MuseSGen2/MuseStreamRecorder'
import FakeMuseProducer from '../testDoubles/MuseProducer/FakeMuseProducer'
import SpyMuseStreamProducer from '../testDoubles/MuseProducer/SpyMuseStreamProducer'
import FakeMuseRecorder from '../testDoubles/MuseRecorder/FakeMuseRecorder'

export default class AbstractBiosensorsTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeBleAdapter()
        this.setFakeBleScanner()
        this.setFakeLslOutlet()
        this.setFakeStreamInfo()
        this.setFakeXdfRecorder()
    }

    protected static setFakeBleAdapter() {
        BleDeviceAdapter.Class = FakeBleAdapter
        FakeBleAdapter.resetTestDouble()
    }

    protected static setFakeBleScanner() {
        BleDeviceScanner.Class = FakeBleScanner
        FakeBleScanner.resetTestDouble()
    }

    protected static setFakeLslOutlet() {
        LslStreamOutlet.Class = FakeLslOutlet
        FakeLslOutlet.resetTestDouble()
    }

    protected static setFakeMuseProducer() {
        MuseStreamProducer.Class = FakeMuseProducer
        FakeMuseProducer.resetTestDouble()
    }

    protected static setFakeMuseRecorder() {
        MuseStreamRecorder.Class = FakeMuseRecorder
        FakeMuseRecorder.resetTestDouble()
    }

    protected static setFakeStreamInfo() {
        LslStreamInfo.Class = FakeStreamInfo
        FakeStreamInfo.resetTestDouble()
    }

    protected static setFakeXdfRecorder() {
        XdfStreamRecorder.Class = FakeXdfRecorder
        FakeXdfRecorder.resetTestDouble()
    }

    protected static setSpyMuseStreamProducer() {
        MuseStreamProducer.Class = SpyMuseStreamProducer
    }

    protected static async FakePeripheral(options?: PeripheralOptions) {
        return new FakePeripheral(options)
    }
}
