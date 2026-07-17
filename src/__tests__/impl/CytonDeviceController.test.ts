import { randomInt } from 'node:crypto'

import { FakeUsbController, FakeStreamOutlet } from '@neurodevs/node-lsl'
import { test, assert } from '@neurodevs/node-tdd'

import CytonDeviceController, {
    CytonControllerOptions,
} from '../../impl/openbci/CytonDeviceController.js'
import AbstractDeviceControllerTest from '../AbstractDeviceControllerTest.js'
import SpyCytonController from '../../testDoubles/CytonController/SpyCytonController.js'

export default class CytonDeviceControllerTest extends AbstractDeviceControllerTest {
    protected static instance: SpyCytonController

    private static readonly serialNumber = this.deviceId
    private static readonly realDeviceInfo = `OpenBCI V3 8-16 channel\nOn Board ADS1299 Device ID: 0x3E\nLIS3DH Device ID: 0x33\nFirmware: v3.1.2\n$$$`
    private static readonly realBuffer = Buffer.from(this.realDeviceInfo)

    private static readonly waitCalls: number[] = []

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeUsbController()

        CytonDeviceController.Class = SpyCytonController

        CytonDeviceController.wait = async (ms: number) => {
            this.waitCalls.push(ms)
        }
        this.waitCalls.length = 0

        this.instance = await this.CytonDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async startsWithIsConnectedFalse() {
        await this.assertStartsWithIsConnectedFalse()
    }

    @test()
    protected static async startsWithIsStreamingFalse() {
        await this.assertStartsWithIsStreamingFalse()
    }

    @test()
    protected static async connectSetsIsConnectedTrue() {
        await this.assertConnectSetsIsConnectedTrue()
    }

    @test()
    protected static async startStreamingSetsIsStreamingTrue() {
        await this.assertStartStreamingSetsIsStreamingTrue()
    }

    @test()
    protected static async stopStreamingSetsIsStreamingFalse() {
        await this.assertStopStreamingSetsIsStreamingFalse()
    }

    @test()
    protected static async disconnectSetsIsConnectedFalse() {
        await this.assertDisconnectSetsIsConnectedFalse()
    }

    @test()
    protected static async disconnectCallsStopStreaming() {
        await this.assertDisconnectCallsStopStreaming()
    }

    @test()
    protected static async disconnectDoesNotCallStopStreamingIfNotStreaming() {
        await this.assertDisconnectDoesNotCallStopStreamingIfNotStreaming()
    }

    @test()
    protected static async connectWarnsWithDeviceId() {
        await this.assertConnectWarnsWithDeviceId()
    }

    @test()
    protected static async startStreamingWarnsWithDeviceId() {
        await this.assertStartStreamingWarnsWithDeviceId()
    }

    @test()
    protected static async stopStreamingWarnsWithDeviceId() {
        await this.assertStopStreamingWarnsWithDeviceId()
    }

    @test()
    protected static async disconnectWarnsWithDeviceId() {
        await this.assertDisconnectWarnsWithDeviceId()
    }

    @test()
    protected static async createsXdfRecorderIfPassedPath() {
        await this.assertCreatesXdfRecorderIfPassedPath()
    }

    @test()
    protected static async connectStartsXdfRecorder() {
        await this.assertConnectStartsXdfRecorder()
    }

    @test()
    protected static async disconnectFinishesXdfRecorder() {
        await this.assertDisconnectFinishesXdfRecorder()
    }

    @test()
    protected static async createsUsbController() {
        assert.isEqualDeep(FakeUsbController.callsToConstructor[0], {
            onData: this.getOnData(),
            serialNumber: this.serialNumber,
        })
    }

    @test()
    protected static async callsConnectOnUsbController() {
        await this.connect()

        assert.isEqual(
            FakeUsbController.numCallsToConnect,
            1,
            'Did not call connect!'
        )
    }

    @test()
    protected static async connectWaitsForBoardToReboot() {
        await this.connect()

        assert.isEqual(
            this.waitCalls[0],
            2000,
            'Should default waitAfterConnectMs to 2000ms!'
        )
    }

    @test()
    protected static async overridesDefaultWaitAfterConnectMs() {
        const fakeWaitAfterConnectMs = randomInt(1, 100)

        const instance = await this.CytonDeviceController({
            waitAfterConnectMs: fakeWaitAfterConnectMs,
        })
        await instance.connect()

        assert.isEqual(
            this.waitCalls[0],
            fakeWaitAfterConnectMs,
            'Did not override waitAfterConnectMs!'
        )
    }

    @test()
    protected static async resetsDeviceWithWriteUsbV() {
        await this.connect()

        assert.isEqualDeep(FakeUsbController.callsToWriteUsb[0], 'v')
    }

    @test()
    protected static async writesUsbVOnConnectEvenWithLogDeviceInfoFalse() {
        const instance = await this.CytonDeviceController({
            logDeviceInfo: false,
        })
        await instance.connect()

        assert.isEqualDeep(FakeUsbController.callsToWriteUsb[0], 'v')
    }

    @test()
    protected static async writesUsbVAfterWaitAfterConnectMs() {
        const order: string[] = []

        CytonDeviceController.wait = async () => {
            order.push('wait')
        }

        const originalWriteUsb = FakeUsbController.prototype.writeUsb
        FakeUsbController.prototype.writeUsb = async function (value: string) {
            order.push(`writeUsb:${value}`)
            return originalWriteUsb.call(this, value)
        }

        try {
            await this.connect()
        } finally {
            FakeUsbController.prototype.writeUsb = originalWriteUsb
        }

        assert.isEqualDeep(
            order,
            ['wait', 'writeUsb:v'],
            `Should write 'v' after waiting for waitAfterConnectMs!`
        )
    }

    @test()
    protected static async startsStreamingWithWriteUsbB() {
        await this.startStreaming()

        assert.isEqualDeep(FakeUsbController.callsToWriteUsb[0], 'b')
    }

    @test()
    protected static async stopsStreamingWithWriteUsbS() {
        await this.startStreaming()
        await this.stopStreaming()

        const calls = FakeUsbController.callsToWriteUsb
        assert.isEqualDeep(calls[calls.length - 1], 's')
    }

    @test()
    protected static async logsDeviceInfoAccumulatedAcrossMultipleOnDataCalls() {
        let loggedDeviceInfo: string | undefined

        CytonDeviceController.log = (msg: string) => {
            loggedDeviceInfo = msg
        }

        const onData = await this.getLogEnabledOnData()

        const chunks = [
            this.realDeviceInfo.slice(0, 17),
            this.realDeviceInfo.slice(17, 62),
            this.realDeviceInfo.slice(62),
        ]

        for (const chunk of chunks) {
            assert.isFalsy(
                loggedDeviceInfo,
                'Should not log device info before "$$$" is fully received!'
            )

            const data = Buffer.from(chunk)
            onData(data, data.length, 0)
        }

        assert.isEqual(
            loggedDeviceInfo,
            `\n${this.realDeviceInfo}\n`,
            'Did not log device info!'
        )
    }

    @test()
    protected static async stopsLoggingDeviceInfoAfterFirstReceipt() {
        const deviceInfoLogs: string[] = []

        CytonDeviceController.log = (msg: unknown) => {
            if (typeof msg === 'string') {
                deviceInfoLogs.push(msg)
            }
        }

        const onData = await this.getLogEnabledOnData()

        onData(this.realBuffer, this.realBuffer.length, 0)
        onData(this.realBuffer, this.realBuffer.length, 0)

        assert.isLength(
            deviceInfoLogs,
            1,
            'Should not keep logging device info text after the first time it is received!'
        )
    }

    @test()
    protected static async stripsInvalidBytesFromLoggedDeviceInfo() {
        let loggedDeviceInfo: string | undefined

        CytonDeviceController.log = (msg: string) => {
            loggedDeviceInfo = msg
        }

        const onData = await this.getLogEnabledOnData()

        const strayByte = Buffer.from([0xff])
        onData(strayByte, strayByte.length, 0)
        onData(this.realBuffer, this.realBuffer.length, 0)

        assert.isEqual(
            loggedDeviceInfo,
            `\n${this.realDeviceInfo}\n`,
            'Should strip invalid bytes from logged device info!'
        )
    }

    @test()
    protected static async doesNotLogDeviceInfoByDefault() {
        let wasCalled = false

        CytonDeviceController.log = () => {
            wasCalled = true
        }

        const onData = this.getOnData()

        onData(this.realBuffer, this.realBuffer.length, 0)

        assert.isFalse(wasCalled, 'Should not have logged!')
    }

    @test()
    protected static async doesNotLogPacketsBeforeDeviceInfoReceived() {
        let wasCalled = false

        CytonDeviceController.log = () => {
            wasCalled = true
        }

        const onData = await this.getLogEnabledOnData()

        const noise = Buffer.from([0xff])
        onData(noise, noise.length, 0)

        assert.isFalse(
            wasCalled,
            'Should not log packets before device info has been received!'
        )
    }

    @test()
    protected static async disconnectsUsbController() {
        await this.connect()
        await this.disconnect()

        assert.isEqual(
            FakeUsbController.numCallsToDisconnect,
            1,
            'Did not call disconnect!'
        )
    }

    @test()
    protected static async createsExgLslOutlet() {
        assert.isEqualDeep(FakeStreamOutlet.callsToConstructor[0], {
            name: `Cyton ExG (${this.serialNumber})`,
            type: 'ExG',
            channelNames: [
                'CH1',
                'CH2',
                'CH3',
                'CH4',
                'CH5',
                'CH6',
                'CH7',
                'CH8',
            ],
            sampleRateHz: 250,
            channelFormat: 'float32',
            sourceId: `cyton-exg-${this.serialNumber}`,
            manufacturer: 'OpenBCI',
            units: 'microvolt',
            chunkSize: 1,
        })
    }

    @test()
    protected static async createsAccelLslOutlet() {
        assert.isEqualDeep(FakeStreamOutlet.callsToConstructor[1], {
            name: `Cyton Accelerometer (${this.serialNumber})`,
            type: 'ACCEL',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: 25,
            channelFormat: 'float32',
            sourceId: `cyton-accelerometer-${this.serialNumber}`,
            manufacturer: 'OpenBCI',
            units: 'g',
            chunkSize: 1,
        })
    }

    private static getOnData() {
        return this.instance.getOnData()
    }

    private static async getLogEnabledOnData() {
        const instance = await this.LogEnabledCyton()
        return instance.getOnData()
    }

    private static async CytonDeviceController(
        options?: Partial<CytonControllerOptions>
    ) {
        return (await CytonDeviceController.Create({
            serialNumber: this.serialNumber,
            xdfRecordPath: this.xdfRecordPath,
            ...options,
        })) as SpyCytonController
    }

    private static async LogEnabledCyton() {
        return await this.CytonDeviceController({
            logDeviceInfo: true,
        })
    }
}
