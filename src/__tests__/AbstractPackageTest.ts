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
    FakeStreamOutlet,
    LslStreamInfo,
    FakeStreamInfo,
    LslStreamInlet,
    FakeStreamInlet,
    LslWebSocketBridge,
    FakeWebSocketBridge,
    FakeWebSocketServer,
    FakeLiblsl,
    LiblslAdapter,
    LslEventMarkerEmitter,
    FakeEventMarkerEmitter,
} from '@neurodevs/node-lsl'
import AbstractModuleTest from '@neurodevs/node-tdd'
import {
    XdfStreamRecorder,
    FakeXdfRecorder,
    XdfFileLoader,
    FakeXdfLoader,
} from '@neurodevs/node-xdf'
import { Server } from 'ws'

import BiosensorDeviceFactory, {
    DeviceStreamerOptions,
} from '../impl/BiosensorDeviceFactory.js'
import BiosensorWebSocketGateway from '../impl/BiosensorWebSocketGateway.js'
import CgxDeviceStreamer from '../impl/devices/CgxDeviceStreamer.js'
import MuseDeviceStreamer from '../impl/devices/MuseDeviceStreamer.js'
import ZephyrDeviceStreamer from '../impl/devices/ZephyrDeviceStreamer.js'
import FakeDeviceFactory from '../testDoubles/DeviceFactory/FakeDeviceFactory.js'
import FakeCgxDeviceStreamer from '../testDoubles/DeviceStreamer/CgxDeviceStreamer/FakeCgxDeviceStreamer.js'
import SpyCgxDeviceStreamer from '../testDoubles/DeviceStreamer/CgxDeviceStreamer/SpyCgxDeviceStreamer.js'
import FakeDeviceStreamer from '../testDoubles/DeviceStreamer/FakeDeviceStreamer.js'
import FakeMuseDeviceStreamer from '../testDoubles/DeviceStreamer/MuseDeviceStreamer/FakeMuseDeviceStreamer.js'
import SpyMuseDeviceStreamer from '../testDoubles/DeviceStreamer/MuseDeviceStreamer/SpyMuseDeviceStreamer.js'
import FakeZephyrDeviceStreamer from '../testDoubles/DeviceStreamer/ZephyrDeviceStreamer/FakeZephyrDeviceStreamer.js'
import FakeDeviceFTDI from '../testDoubles/FTDI/FakeDeviceFTDI.js'
import FakeFTDI from '../testDoubles/FTDI/FakeFTDI.js'
import FakeWebSocketGateway from '../testDoubles/WebSocketGateway/FakeWebSocketGateway.js'

export default class AbstractPackageTest extends AbstractModuleTest {
    protected static fakeLiblsl: FakeLiblsl

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeBleController()
        this.setFakeBleConnector()
        this.setFakeBleScanner()
        this.setFakeFTDI()
        this.setFakeLiblsl()
        this.setFakeEventMarkerEmitter()
        this.setFakeStreamInlet()
        this.setFakeStreamOutlet()
        this.setFakeStreamInfo()
        this.setFakeWebSocketBridge()
        this.setFakeXdfLoader()
        this.setFakeXdfRecorder()
    }

    protected static setFakeDevices() {
        this.setFakeCgxDeviceStreamer()
        this.setFakeMuseDeviceStreamer()
        this.setFakeZephyrDeviceStreamer()

        FakeDeviceStreamer.resetTestDouble()
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

    protected static setFakeDeviceFactory() {
        BiosensorDeviceFactory.Class = FakeDeviceFactory
        FakeDeviceFactory.resetTestDouble()
    }

    protected static setFakeFTDI() {
        CgxDeviceStreamer.FTDI = FakeFTDI as any
        FakeFTDI.resetTestDouble()
        FakeDeviceFTDI.resetTestDouble()

        FakeFTDI.setFakeDeviceInfos()
    }

    protected static setFakeLiblsl() {
        this.fakeLiblsl = new FakeLiblsl()
        LiblslAdapter.setInstance(this.fakeLiblsl)
    }

    protected static setFakeEventMarkerEmitter() {
        LslEventMarkerEmitter.Class = FakeEventMarkerEmitter
        FakeEventMarkerEmitter.resetTestDouble()
    }

    protected static setFakeStreamInlet() {
        LslStreamInlet.Class = FakeStreamInlet
        FakeStreamInlet.resetTestDouble()
    }

    protected static setFakeStreamOutlet() {
        LslStreamOutlet.Class = FakeStreamOutlet
        FakeStreamOutlet.resetTestDouble()
    }

    protected static setFakeMuseDeviceStreamer() {
        MuseDeviceStreamer.Class = FakeMuseDeviceStreamer
        FakeMuseDeviceStreamer.resetTestDouble()
    }

    protected static setFakeStreamInfo() {
        LslStreamInfo.Class = FakeStreamInfo
        FakeStreamInfo.resetTestDouble()
    }

    protected static setFakeWebSocketBridge() {
        LslWebSocketBridge.Class = FakeWebSocketBridge
        FakeWebSocketBridge.resetTestDouble()

        LslWebSocketBridge.WSS = FakeWebSocketServer as unknown as typeof Server
        FakeWebSocketServer.resetTestDouble()
    }

    protected static setFakeWebSocketGateway() {
        BiosensorWebSocketGateway.Class = FakeWebSocketGateway
        FakeWebSocketGateway.resetTestDouble()
    }

    protected static setFakeXdfLoader() {
        XdfFileLoader.Class = FakeXdfLoader
        FakeXdfLoader.resetTestDouble()
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
