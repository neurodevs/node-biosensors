import { randomInt } from 'node:crypto'

import { Server } from 'ws'
import {
    FakeLiblsl,
    FakeLibndx,
    LiblslAdapter,
    LibndxAdapter,
} from '@neurodevs/ndx-native'
import {
    LslStreamOutlet,
    FakeLslOutlet,
    LslStreamInfo,
    FakeLslInfo,
    LslStreamInlet,
    FakeLslInlet,
    LslWebSocketBridge,
    FakeLslWsBridge,
    FakeWebSocketServer,
    LslEventMarkerOutlet,
    FakeEventMarkerOutlet,
    BleGattController,
    FakeBleGatt,
    WindowedClockRegressor,
    FakeClockRegressor,
    UsbDeviceController,
    FakeUsbDevice,
    BleObserverController,
    FakeBleObserver,
} from '@neurodevs/node-lsl'
import AbstractModuleTest, { assert } from '@neurodevs/node-tdd'
import {
    XdfStreamRecorder,
    FakeXdfRecorder,
    XdfFileLoader,
    FakeXdfLoader,
} from '@neurodevs/node-xdf'

import BiosensorDeviceFactory from '../impl/BiosensorDeviceFactory.js'
import { DeviceControllerConstructorOptions } from '../types.js'
import BiosensorWebSocketGateway from '../impl/BiosensorWebSocketGateway.js'
import CgxDeviceController from '../impl/cognionics/CgxDeviceController.js'
import GoveeDeviceController from '../impl/govee/GoveeDeviceController.js'
import ZephyrDeviceController from '../impl/zephyr/ZephyrDeviceController.js'
import FakeDeviceFactory from '../testDoubles/DeviceFactory/FakeDeviceFactory.js'
import FakeCgxController from '../testDoubles/CgxController/FakeCgxController.js'
import FakeGoveeController from '../testDoubles/GoveeController/FakeGoveeController.js'
import SpyCgxController from '../testDoubles/CgxController/SpyCgxController.js'
import FakeDeviceController from '../testDoubles/DeviceController/FakeDeviceController.js'
import FakeZephyrController from '../testDoubles/ZephyrController/FakeZephyrController.js'
import FakeDeviceFTDI from '../testDoubles/FTDI/FakeDeviceFTDI.js'
import FakeFTDI from '../testDoubles/FTDI/FakeFTDI.js'
import FakeWebSocketGateway from '../testDoubles/WebSocketGateway/FakeWebSocketGateway.js'
import MuseDeviceController from '../impl/muse/MuseDeviceController.js'
import FakeMuseController from '../testDoubles/MuseController/FakeMuseController.js'
import MuseModelDetector from '../impl/muse/MuseModelDetector.js'
import CytonDeviceController from '../impl/openbci/CytonDeviceController.js'
import FakeCytonController from '../testDoubles/CytonController/FakeCytonController.js'
import FakeMuseDetector from '../testDoubles/MuseDetector/FakeMuseDetector.js'

export default class AbstractPackageTest extends AbstractModuleTest {
    protected static fakeLiblsl: FakeLiblsl
    protected static fakeLibndx: FakeLibndx

    protected static readonly fakeClockRegressorValue = randomInt(1, 10)

    private static readonly realSetTimeout = globalThis.setTimeout

    private static readonly realBleSetTimeout = BleGattController.setTimeout
    private static readonly realOutletSetTimeout = LslStreamOutlet.setTimeout

    protected static async beforeEach() {
        await super.beforeEach()

        this.setImmediateTimeouts()

        this.setFakeBleGatt()
        this.setFakeBleObserver()
        this.setFakeFTDI()
        this.setFakeLiblsl()
        this.setFakeLibndx()
        this.setFakeLslEmitter()
        this.setFakeLslInlet()
        this.setFakeLslOutlet()
        this.setFakeLslInfo()
        this.setFakeLslWsBridge()
        this.setFakeXdfLoader()
        this.setFakeXdfRecorder()
        this.setFakeClockRegressor()
    }

    protected static async afterEach() {
        globalThis.setTimeout = this.realSetTimeout
        BleGattController.setTimeout = this.realBleSetTimeout
        LslStreamOutlet.setTimeout = this.realOutletSetTimeout

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
        globalThis.setTimeout = this.immediateSetTimeout

        LslStreamOutlet.setTimeout = this.immediateSetTimeout

        BleGattController.setTimeout = ((
            callback: (...args: unknown[]) => void,
            _delayMs?: number,
            ...args: unknown[]
        ) => this.realSetTimeout(callback, 0, ...args)) as typeof setTimeout
    }

    private static readonly immediateSetTimeout = ((
        callback: (...args: unknown[]) => void,
        _delayMs?: number,
        ...args: unknown[]
    ) => {
        callback(...args)
        return 0
    }) as unknown as typeof setTimeout

    protected static setFakeDevices() {
        this.setFakeCgxController()
        this.setFakeCytonController()
        this.setFakeGoveeController()
        this.setFakeMuseController()
        this.setFakeZephyrController()

        FakeDeviceController.resetTestDouble()
    }

    protected static setFakeBleGatt() {
        BleGattController.Class = FakeBleGatt
        FakeBleGatt.resetTestDouble()
    }

    protected static setFakeBleObserver() {
        BleObserverController.Class = FakeBleObserver
        FakeBleObserver.resetTestDouble()
    }

    protected static setFakeCgxController() {
        CgxDeviceController.Class = FakeCgxController
        FakeCgxController.resetTestDouble()
    }

    protected static setFakeGoveeController() {
        GoveeDeviceController.Class = FakeGoveeController
        FakeGoveeController.resetTestDouble()
    }

    protected static setFakeCytonController() {
        CytonDeviceController.Class = FakeCytonController
        FakeCytonController.resetTestDouble()
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

    protected static setFakeLibndx() {
        this.fakeLibndx = new FakeLibndx()
        LibndxAdapter.setInstance(this.fakeLibndx)
    }

    protected static setFakeLslEmitter() {
        LslEventMarkerOutlet.Class = FakeEventMarkerOutlet
        FakeEventMarkerOutlet.resetTestDouble()
    }

    protected static setFakeMuseDetector() {
        MuseModelDetector.Class = FakeMuseDetector
        FakeMuseDetector.resetTestDouble()
    }

    protected static setFakeLslInlet() {
        LslStreamInlet.Class = FakeLslInlet
        FakeLslInlet.resetTestDouble()
    }

    protected static setFakeLslOutlet() {
        LslStreamOutlet.Class = FakeLslOutlet
        FakeLslOutlet.resetTestDouble()
    }

    protected static setFakeMuseController() {
        MuseDeviceController.Class = FakeMuseController
        FakeMuseController.resetTestDouble()
    }

    protected static setFakeLslInfo() {
        LslStreamInfo.Class = FakeLslInfo
        FakeLslInfo.resetTestDouble()
    }

    protected static setFakeUsbController() {
        UsbDeviceController.Class = FakeUsbDevice
        FakeUsbDevice.resetTestDouble()
    }

    protected static setFakeLslWsBridge() {
        LslWebSocketBridge.Class = FakeLslWsBridge
        FakeLslWsBridge.resetTestDouble()

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

    protected static FakeDeviceController(
        options?: DeviceControllerConstructorOptions
    ) {
        return new FakeDeviceController(options)
    }
}
