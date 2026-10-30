import { FakeRfcommDevice, FakeLslOutlet } from '@neurodevs/node-lsl'
import { test, assert } from '@neurodevs/node-tdd'
import { FakeXdfRecorder } from '@neurodevs/node-xdf'

import ZephyrDeviceController, {
    ZephyrControllerOptions,
} from '../../../impl/zephyr/ZephyrDeviceController.js'
import SpyZephyrController from '../../../testDoubles/ZephyrController/SpyZephyrController.js'
import { LogLevel } from '../../../types.js'
import AbstractDeviceControllerTest from '../../AbstractDeviceControllerTest.js'

export default class ZephyrDeviceControllerTest extends AbstractDeviceControllerTest {
    protected static instance: SpyZephyrController

    private static readonly address = this.deviceId
    private static readonly arrivalSec = Math.random() * 1000

    private static readonly callsToSetInterval: {
        callback: () => void
        ms?: number
    }[] = []
    private static readonly callsToClearInterval: unknown[] = []
    private static readonly fakeInterval = {}

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeRfcommDevice()
        this.setFakeIntervals()

        ZephyrDeviceController.Class = SpyZephyrController

        this.instance = await this.ZephyrDeviceController()
    }

    @test()
    protected static async createsInstance() {
        await this.assertCreatesInstance()
    }

    @test()
    protected static async reportsDeviceName() {
        assert.isEqual(
            this.instance.deviceName,
            'Zephyr BioHarness 3',
            'Did not report device name!'
        )
    }

    @test()
    protected static async identifiesDeviceByBluetoothAddress() {
        assert.isEqual(
            this.instance.identifier,
            this.address,
            'Did not identify the device by its Bluetooth address!'
        )
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
    protected static async startStreamingDoesNotHandleIfNotConnected() {
        await this.assertStartStreamingDoesNotHandleIfNotConnected()
    }

    @test()
    protected static async startStreamingLeavesIsStreamingFalseIfNotConnected() {
        await this.assertStartStreamingLeavesIsStreamingFalseIfNotConnected()
    }

    @test()
    protected static async startStreamingWarnsIfNotConnected() {
        await this.assertStartStreamingWarnsIfNotConnected()
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
    protected static async reportsEveryStateChange() {
        await this.assertReportsEveryStateChange()
    }

    @test()
    protected static async reportsConnectingWhileConnectInProgress() {
        await this.assertReportsConnectingWhileConnectInProgress()
    }

    @test()
    protected static async revertsToDisconnectedWhenConnectFails() {
        await this.assertRevertsToDisconnectedWhenConnectFails()
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
    protected static async disconnectDestroysEveryOutlet() {
        await this.assertDisconnectDestroysEveryOutlet()
    }

    @test()
    protected static async disconnectDestroysOutletsAfterFailedConnect() {
        await this.assertDisconnectDestroysOutletsAfterFailedConnect()
    }

    @test()
    protected static async destroysOutletsOnlyOnce() {
        await this.assertDestroysOutletsOnlyOnce()
    }

    @test()
    protected static async reportsDisconnectingBeforeDestroyingOutlets() {
        await this.assertReportsDisconnectingBeforeDestroyingOutlets()
    }

    @test()
    protected static async reportsDisconnectingAfterFailedConnect() {
        await this.assertReportsDisconnectingAfterFailedConnect()
    }

    @test()
    protected static async logsIfPassedLogLevelInfo() {
        await this.assertLogsIfPassedLogLevelInfo()
    }

    @test()
    protected static async doesNotLogInfoIfLogLevelSilent() {
        await this.assertDoesNotLogInfoIfLogLevelSilent()
    }

    @test()
    protected static async doesNotLogByDefault() {
        await this.assertDoesNotLogByDefault()
    }

    @test()
    protected static async warnsIfLogLevelInfo() {
        await this.assertWarnsIfLogLevelInfo()
    }

    @test()
    protected static async doesNotWarnIfLogLevelSilent() {
        await this.assertDoesNotWarnIfLogLevelSilent()
    }

    @test()
    protected static async createsRfcommDeviceWithAddressAndNamePrefix() {
        assert.isEqualDeep(
            FakeRfcommDevice.callsToConstructor[0],
            {
                onData: this.instance.getOnData(),
                address: this.address,
                namePrefix: 'BH BHT',
            },
            'Did not create Bluetooth device as expected!'
        )
    }

    @test()
    protected static async identifiesDeviceByDiscoveredAddressIfNoneGiven() {
        const discoveredAddress = this.generateId()
        FakeRfcommDevice.fakeAddress = discoveredAddress

        const instance = await this.ZephyrDeviceController({
            address: undefined,
        })

        assert.isEqual(
            instance.identifier,
            discoveredAddress,
            'Did not identify the device by its discovered address!'
        )
    }

    @test()
    protected static async connectCallsConnectOnRfcommDevice() {
        await this.connect()

        assert.isEqual(
            FakeRfcommDevice.numCallsToConnect,
            1,
            'Did not connect to the Bluetooth device!'
        )
    }

    @test()
    protected static async disconnectCallsDisconnectOnRfcommDevice() {
        await this.connect()
        await this.disconnect()

        assert.isEqual(
            FakeRfcommDevice.numCallsToDisconnect,
            1,
            'Did not disconnect from the Bluetooth device!'
        )
    }

    @test()
    protected static async connectSendsLifesignEveryTwoSeconds() {
        await this.connect()

        const { callback, ms } = this.callsToSetInterval[0] ?? {}
        callback?.()

        assert.isEqualDeep(
            { ms, written: FakeRfcommDevice.callsToWrite[0] },
            { ms: 2000, written: this.frame(0x23, []) },
            'Did not send a lifesign every two seconds to keep the link up!'
        )
    }

    @test()
    protected static async disconnectStopsSendingLifesigns() {
        await this.connect()
        await this.disconnect()

        assert.isEqualDeep(
            this.callsToClearInterval,
            [this.fakeInterval],
            'Did not stop sending lifesigns on disconnect!'
        )
    }

    @test()
    protected static async startStreamingEnablesEveryStream() {
        await this.connect()
        await this.startStreaming()

        assert.isEqualDeep(
            FakeRfcommDevice.callsToWrite,
            [
                this.frame(0x16, [1]),
                this.frame(0x15, [1]),
                this.frame(0xbc, [1]),
                this.frame(0x19, [1]),
            ],
            'Did not enable the ECG, breathing, accelerometer and R-to-R packets!'
        )
    }

    @test()
    protected static async stopStreamingDisablesEveryStream() {
        await this.connect()
        await this.startStreaming()
        FakeRfcommDevice.callsToWrite.length = 0

        await this.stopStreaming()

        assert.isEqualDeep(
            FakeRfcommDevice.callsToWrite,
            [
                this.frame(0x16, [0]),
                this.frame(0x15, [0]),
                this.frame(0xbc, [0]),
                this.frame(0x19, [0]),
            ],
            'Did not disable the ECG, breathing, accelerometer and R-to-R packets!'
        )
    }

    @test()
    protected static async onlyEnablesStreamsThatAreNotDisabled() {
        this.instance = await this.ZephyrDeviceController({
            disableStreams: ['Respiration', 'Accelerometer', 'RtoR'],
        })

        await this.connect()
        await this.startStreaming()

        assert.isEqualDeep(
            FakeRfcommDevice.callsToWrite,
            [this.frame(0x16, [1])],
            'Should only enable streams that are not disabled!'
        )
    }

    @test()
    protected static async createsEcgOutlet() {
        assert.isEqualDeep(FakeLslOutlet.callsToConstructor[0], {
            name: `Zephyr ECG (${this.address})`,
            type: 'ECG',
            channelNames: ['ECG'],
            sampleRateHz: 250,
            channelFormat: 'float32',
            sourceId: `zephyr-ecg-${this.address}`,
            manufacturer: 'Zephyr',
            units: 'millivolt',
            chunkSize: 63,
        })
    }

    @test()
    protected static async createsRespirationOutlet() {
        assert.isEqualDeep(FakeLslOutlet.callsToConstructor[1], {
            name: `Zephyr Respiration (${this.address})`,
            type: 'RESP',
            channelNames: ['Respiration'],
            sampleRateHz: 1000 / 56,
            channelFormat: 'float32',
            sourceId: `zephyr-respiration-${this.address}`,
            manufacturer: 'Zephyr',
            units: 'unnormalized',
            chunkSize: 18,
        })
    }

    @test()
    protected static async createsAccelerometerOutlet() {
        assert.isEqualDeep(FakeLslOutlet.callsToConstructor[2], {
            name: `Zephyr Accelerometer (${this.address})`,
            type: 'ACCEL',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: 50,
            channelFormat: 'float32',
            sourceId: `zephyr-accelerometer-${this.address}`,
            manufacturer: 'Zephyr',
            units: 'g',
            chunkSize: 20,
        })
    }

    @test()
    protected static async createsRtoROutlet() {
        assert.isEqualDeep(FakeLslOutlet.callsToConstructor[3], {
            name: `Zephyr R-to-R (${this.address})`,
            type: 'RR',
            channelNames: ['RtoR'],
            sampleRateHz: 1000 / 56,
            channelFormat: 'float32',
            sourceId: `zephyr-rtor-${this.address}`,
            manufacturer: 'Zephyr',
            units: 'millisecond',
            chunkSize: 18,
        })
    }

    @test()
    protected static async describesEachOutletWithNickname() {
        FakeLslOutlet.callsToConstructor.length = 0
        const nickname = this.generateId()

        await this.ZephyrDeviceController({ nickname })

        assert.isEqualDeep(
            FakeLslOutlet.callsToConstructor.map((call) => call?.description),
            new Array(4).fill({ nickname }),
            'Should describe each outlet with the nickname!'
        )
    }

    @test()
    protected static async doesNotCreateOutletsForDisabledStreams() {
        FakeLslOutlet.callsToConstructor.length = 0

        await this.ZephyrDeviceController({
            disableStreams: ['ECG', 'Respiration', 'Accelerometer', 'RtoR'],
        })

        assert.isLength(
            FakeLslOutlet.callsToConstructor,
            0,
            'Should not create outlets for disabled streams!'
        )
    }

    @test()
    protected static async exposesStreamQueries() {
        assert.isEqualDeep(
            this.instance.streamQueries,
            this.streamQueries,
            'Should expose stream queries!'
        )
    }

    @test()
    protected static async passesStreamQueriesToRecorder() {
        assert.isEqualDeep(
            FakeXdfRecorder.callsToConstructor[0]?.streamQueries,
            this.streamQueries,
            'Did not pass stream queries to the recorder!'
        )
    }

    @test()
    protected static async constructsClockRegressorForEachStreamRate() {
        this.assertConstructsClockRegressorWith(250)
        this.assertConstructsClockRegressorWith(1000 / 56)
        this.assertConstructsClockRegressorWith(50)
    }

    @test()
    protected static async pushesEcgSamplesInMillivolts() {
        const raw = this.range(63, (i) => 512 + i)

        this.simulateData(this.ecgFrame(raw))

        assert.isEqualDeep(
            FakeLslOutlet.callsToPushSample,
            raw.map((v) => ({
                sample: [(v - 512) * 0.025],
                timestampSec: this.fakeClockRegressorValue,
            })),
            'Did not push ECG samples in millivolts!'
        )
    }

    @test()
    protected static async derivesEcgTimestampsFromDeviceTime() {
        this.simulateData(this.ecgFrame(this.range(63, () => 600)))

        this.assertDerivesTimestampsWith(
            this.deviceSec + 62 / 250,
            this.arrivalSec,
            63
        )
    }

    @test()
    protected static async pushesRespirationSamples() {
        const raw = this.range(18, (i) => 500 + i * 3)

        this.simulateData(this.respirationFrame(raw))

        assert.isEqualDeep(
            FakeLslOutlet.callsToPushSample.map(({ sample }) => sample),
            raw.map((v) => [v - 512]),
            'Did not push respiration samples!'
        )
    }

    @test()
    protected static async pushesAccelerometerSamplesInG() {
        const xyz = this.range(60, (i) => (i % 2 === 0 ? i : -i))

        this.simulateData(this.accelFrame(xyz))

        const expected = this.range(20, (i) => [
            xyz[3 * i]! * 0.1,
            xyz[3 * i + 1]! * 0.1,
            xyz[3 * i + 2]! * 0.1,
        ])

        assert.isEqualDeep(
            FakeLslOutlet.callsToPushSample.map(({ sample }) => sample),
            expected,
            'Did not push accelerometer samples in g!'
        )
    }

    @test()
    protected static async pushesRtoRSamplesInMilliseconds() {
        const intervals = this.range(18, (i) => (i < 9 ? 812 : -790))

        this.simulateData(this.rtorFrame(intervals))

        assert.isEqualDeep(
            FakeLslOutlet.callsToPushSample.map(({ sample }) => sample),
            intervals.map((v) => [v]),
            'Did not push R-to-R samples in milliseconds!'
        )
    }

    @test()
    protected static async decodesFrameSplitAcrossSeveralReads() {
        const frame = this.ecgFrame(this.range(63, () => 700))

        this.simulateData(frame.subarray(0, 10))
        this.simulateData(frame.subarray(10, 50))
        this.simulateData(frame.subarray(50))

        assert.isLength(
            FakeLslOutlet.callsToPushSample,
            63,
            'Did not decode a frame split across several reads!'
        )
    }

    @test()
    protected static async skipsBytesBeforeStartOfFrame() {
        const frame = this.ecgFrame(this.range(63, () => 700))

        this.simulateData(Buffer.concat([Buffer.from([0x99, 0x03]), frame]))

        assert.isLength(
            FakeLslOutlet.callsToPushSample,
            63,
            'Did not skip bytes before the start of a frame!'
        )
    }

    @test()
    protected static async dropsFrameWithBadCrcAndKeepsDecoding() {
        const bad = this.ecgFrame(this.range(63, () => 700))
        bad[bad.length - 2] ^= 0xff

        const good = this.rtorFrame(this.range(18, () => 800))

        this.simulateData(Buffer.concat([bad, good]))

        assert.isEqualDeep(
            FakeLslOutlet.callsToPushSample.map(({ sample }) => sample),
            this.range(18, () => [800]),
            'Did not drop the corrupted frame and keep decoding!'
        )
    }

    @test()
    protected static async ignoresCommandAcknowledgements() {
        this.simulateData(this.frame(0x16, [], 0x06))

        assert.isLength(
            FakeLslOutlet.callsToPushSample,
            0,
            'Should not push anything for acknowledgements!'
        )
    }

    @test()
    protected static async dropsPacketsWhoseDeviceTimeDoesNotIncrease() {
        const frame = this.ecgFrame(this.range(63, () => 700))

        this.simulateData(frame)
        this.simulateData(frame)

        assert.isLength(
            FakeLslOutlet.callsToPushSample,
            63,
            'Should drop a packet whose device time did not increase!'
        )
    }

    private static readonly streamQueries = [
        'type="ECG"',
        'type="RESP"',
        'type="ACCEL"',
        'type="RR"',
    ]

    private static readonly deviceMsOfDay = 45_296_789

    private static get deviceSec() {
        return Date.UTC(2026, 9, 29) / 1000 + this.deviceMsOfDay / 1000
    }

    private static simulateData(data: Buffer) {
        this.instance.getOnData()(data, data.length, this.arrivalSec)
    }

    private static ecgFrame(raw: number[]) {
        return this.frame(0x22, [...this.header, ...this.pack10Bit(raw)])
    }

    private static respirationFrame(raw: number[]) {
        return this.frame(0x21, [...this.header, ...this.pack10Bit(raw)])
    }

    private static accelFrame(xyz: number[]) {
        const unsigned = xyz.map((v) => (v < 0 ? v + 1024 : v))
        return this.frame(0x2a, [...this.header, ...this.pack10Bit(unsigned)])
    }

    private static rtorFrame(intervals: number[]) {
        const bytes = intervals.flatMap((v) => {
            const u = v < 0 ? v + 65536 : v
            return [u & 0xff, u >> 8]
        })
        return this.frame(0x24, [...this.header, ...bytes])
    }

    private static get header() {
        const ms = this.deviceMsOfDay
        return [
            0x01,
            2026 & 0xff,
            2026 >> 8,
            10,
            29,
            ms & 0xff,
            (ms >> 8) & 0xff,
            (ms >> 16) & 0xff,
            (ms >>> 24) & 0xff,
        ]
    }

    private static pack10Bit(values: number[]) {
        const bytes = new Array(Math.ceil((values.length * 10) / 8)).fill(0)

        values.forEach((value, i) => {
            for (let bit = 0; bit < 10; bit++) {
                if ((value >> bit) & 1) {
                    const pos = i * 10 + bit
                    bytes[pos >> 3] |= 1 << (pos & 7)
                }
            }
        })

        return bytes
    }

    private static frame(msgId: number, payload: number[], fin = 0x03) {
        return Buffer.from([
            0x02,
            msgId,
            payload.length,
            ...payload,
            this.crc8(payload),
            fin,
        ])
    }

    private static crc8(payload: number[]) {
        let crc = 0

        for (const byte of payload) {
            crc ^= byte
            for (let bit = 0; bit < 8; bit++) {
                crc = crc & 1 ? (crc >> 1) ^ 0x8c : crc >> 1
            }
        }

        return crc
    }

    private static range<T>(length: number, fn: (i: number) => T) {
        return Array.from({ length }, (_, i) => fn(i))
    }

    private static setFakeIntervals() {
        this.callsToSetInterval.length = 0
        this.callsToClearInterval.length = 0

        ZephyrDeviceController.setInterval = ((
            callback: () => void,
            ms?: number
        ) => {
            this.callsToSetInterval.push({ callback, ms })
            return this.fakeInterval
        }) as unknown as typeof setInterval

        ZephyrDeviceController.clearInterval = ((interval: unknown) => {
            this.callsToClearInterval.push(interval)
        }) as typeof clearInterval
    }

    protected static async simulateDataWithLogLevel(logLevel?: LogLevel) {
        this.instance = await this.ZephyrDeviceController({ logLevel })
        this.simulateData(this.ecgFrame(this.range(63, () => 600)))
    }

    protected static async ControllerWithLogLevel(logLevel: LogLevel) {
        return await this.ZephyrDeviceController({ logLevel })
    }

    private static async ZephyrDeviceController(
        options?: Partial<ZephyrControllerOptions>
    ) {
        return (await ZephyrDeviceController.Create({
            address: this.address,
            xdfRecordPath: this.xdfRecordPath,
            ...options,
        })) as SpyZephyrController
    }
}
