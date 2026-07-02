import { FakeLiblsl, LiblslAdapter } from '@neurodevs/ndx-native'
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
    LslEventMarkerEmitter,
    FakeEventMarkerEmitter,
    BleDeviceController,
    FakeBleController,
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
    DeviceControllerOptions,
} from '../impl/BiosensorDeviceFactory.js'
import BiosensorWebSocketGateway from '../impl/BiosensorWebSocketGateway.js'
import CgxDeviceController from '../impl/devices/CgxDeviceController.js'
import ZephyrDeviceController from '../impl/devices/ZephyrDeviceController.js'
import FakeDeviceFactory from '../testDoubles/DeviceFactory/FakeDeviceFactory.js'
import FakeCgxController from '../testDoubles/devices/CgxController/FakeCgxController.js'
import SpyCgxController from '../testDoubles/devices/CgxController/SpyCgxController.js'
import FakeDeviceController from '../testDoubles/devices/FakeDeviceController.js'
import FakeZephyrController from '../testDoubles/devices/ZephyrController/FakeZephyrController.js'
import FakeDeviceFTDI from '../testDoubles/FTDI/FakeDeviceFTDI.js'
import FakeFTDI from '../testDoubles/FTDI/FakeFTDI.js'
import FakeWebSocketGateway from '../testDoubles/WebSocketGateway/FakeWebSocketGateway.js'
import MuseDeviceController from '../impl/devices/MuseDeviceController.js'
import FakeMuseController from '../testDoubles/devices/MuseController/FakeMuseController.js'

export default class AbstractPackageTest extends AbstractModuleTest {
    protected static fakeLiblsl: FakeLiblsl

    private static readonly realSetTimeout = globalThis.setTimeout

    protected static async beforeEach() {
        await super.beforeEach()

        this.setImmediateTimeouts()

        this.setFakeBleController()
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

    protected static async afterEach() {
        globalThis.setTimeout = this.realSetTimeout

        await super.afterEach()
    }

    protected static setImmediateTimeouts() {
        globalThis.setTimeout = ((
            callback: (...args: unknown[]) => void,
            _delayMs?: number,
            ...args: unknown[]
        ) => {
            callback(...args)
            return 0
        }) as unknown as typeof setTimeout
    }

    protected static setFakeDevices() {
        this.setFakeCgxController()
        this.setFakeMuseController()
        this.setFakeZephyrController()

        FakeDeviceController.resetTestDouble()
    }

    protected static setFakeBleController() {
        BleDeviceController.Class = FakeBleController
        FakeBleController.resetTestDouble()
    }

    protected static setFakeCgxController() {
        CgxDeviceController.Class = FakeCgxController
        FakeCgxController.resetTestDouble()
    }

    protected static setFakeDeviceFactory() {
        BiosensorDeviceFactory.Class = FakeDeviceFactory
        FakeDeviceFactory.resetTestDouble()
    }

    protected static setFakeFTDI() {
        CgxDeviceController.FTDI = FakeFTDI as any
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

    protected static setFakeMuseController() {
        MuseDeviceController.Class = FakeMuseController
        FakeMuseController.resetTestDouble()
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

    protected static setFakeZephyrController() {
        ZephyrDeviceController.Class = FakeZephyrController
        FakeZephyrController.resetTestDouble()
    }

    protected static setSpyCgxController() {
        CgxDeviceController.Class = SpyCgxController
    }

    protected static FakeDeviceController(options?: DeviceControllerOptions) {
        return new FakeDeviceController(options)
    }
}
