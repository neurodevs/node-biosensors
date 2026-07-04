import { randomInt } from 'node:crypto'

import { Server } from 'ws'
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
    WindowedClockRegressor,
    FakeClockRegressor,
} from '@neurodevs/node-lsl'
import AbstractModuleTest, { assert } from '@neurodevs/node-tdd'
import {
    XdfStreamRecorder,
    FakeXdfRecorder,
    XdfFileLoader,
    FakeXdfLoader,
} from '@neurodevs/node-xdf'

import BiosensorDeviceFactory, {
    DeviceControllerOptions,
} from '../impl/BiosensorDeviceFactory.js'
import BiosensorWebSocketGateway from '../impl/BiosensorWebSocketGateway.js'
import CgxDeviceController from '../impl/cognionics/CgxDeviceController.js'
import ZephyrDeviceController from '../impl/zephyr/ZephyrDeviceController.js'
import FakeDeviceFactory from '../testDoubles/DeviceFactory/FakeDeviceFactory.js'
import FakeCgxController from '../testDoubles/CgxController/FakeCgxController.js'
import SpyCgxController from '../testDoubles/CgxController/SpyCgxController.js'
import FakeDeviceController from '../testDoubles/DeviceController/FakeDeviceController.js'
import FakeZephyrController from '../testDoubles/ZephyrController/FakeZephyrController.js'
import FakeDeviceFTDI from '../testDoubles/FTDI/FakeDeviceFTDI.js'
import FakeFTDI from '../testDoubles/FTDI/FakeFTDI.js'
import FakeWebSocketGateway from '../testDoubles/WebSocketGateway/FakeWebSocketGateway.js'
import MuseDeviceController from '../impl/muse/MuseDeviceController.js'
import FakeMuseController from '../testDoubles/MuseController/FakeMuseController.js'

export default class AbstractPackageTest extends AbstractModuleTest {
    protected static fakeLiblsl: FakeLiblsl

    protected static readonly fakeClockRegressorValue = randomInt(1, 10)

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
        this.setFakeClockRegressor()
    }

    protected static async afterEach() {
        globalThis.setTimeout = this.realSetTimeout

        await super.afterEach()
    }

    protected static assertConstructsClockRegressorWith(nominalHz: number) {
        assert.isTrue(
            FakeClockRegressor.callsToConstructor.some(
                (call) => call.nominalHz === nominalHz
            ),
            `Should construct a WindowedClockRegressor with nominalHz ${nominalHz}!`
        )
    }

    protected static assertDerivesTimestampsWith(
        deviceTime: number,
        earliestLslTime: number,
        chunkSize: number
    ) {
        const call = FakeClockRegressor.callsToDeriveTimestamps.find(
            (call) => call.deviceTime === deviceTime
        )

        assert.isEqualDeep(
            call,
            {
                deviceTime,
                earliestLslTime,
                chunkSize,
            },
            'Did not call deriveTimestamps as expected!'
        )
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

    protected static setFakeClockRegressor() {
        WindowedClockRegressor.Class = FakeClockRegressor
        FakeClockRegressor.resetTestDouble()

        FakeClockRegressor.fakeResultValue = this.fakeClockRegressorValue
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
