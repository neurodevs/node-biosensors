import { FakeLslOutlet, FakeUsbDevice } from '@neurodevs/node-lsl'
import { test, assert } from '@neurodevs/node-tdd'
import { FakeXdfRecorder } from '@neurodevs/node-xdf'

import CgxDeviceController, {
    CgxControllerOptions,
} from '../../../impl/cognionics/CgxDeviceController.js'
import SpyCgxController from '../../../testDoubles/CgxController/SpyCgxController.js'
import { LogLevel } from '../../../types.js'
import AbstractDeviceControllerTest from '../../AbstractDeviceControllerTest.js'

export default class CgxDeviceControllerTest extends AbstractDeviceControllerTest {
    protected static instance: SpyCgxController

    private static readonly serialNumber = this.deviceId

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeUsbController()
        this.setSpyCgxController()

        this.instance = await this.CgxDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async reportsDeviceName() {
        assert.isEqual(
            this.instance.deviceName,
            'Cognionics Quick-20r',
            'Did not report device name!'
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
    protected static async warnsIfLogLevelInfo() {
        await this.assertWarnsIfLogLevelInfo()
    }

    @test()
    protected static async doesNotWarnIfLogLevelSilent() {
        await this.assertDoesNotWarnIfLogLevelSilent()
    }

    @test()
    protected static async usesDeviceNameInWarningsWithoutSerialNumber() {
        this.instance = await this.CgxDeviceController({
            serialNumber: undefined,
        })

        await this.disconnect()

        assert.isEqual(
            this.callsToWarn[0][0],
            'Already disconnected from Cognionics Quick-20r.',
            'Did not use device name in warnings without serial number!'
        )
    }

    @test()
    protected static async createsXdfRecorderIfPassedPath() {
        await this.assertCreatesXdfRecorderIfPassedPath()
    }

    @test()
    protected static async passesStreamQueriesToRecorder() {
        assert.isEqualDeep(
            FakeXdfRecorder.callsToConstructor[0]?.streamQueries,
            ['type="EEG"', 'type="ACCEL"'],
            'Incorrect stream queries!'
        )
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
    protected static async createsUsbControllerWithSerialNumberAndCgxPortSettings() {
        const { serialNumber, baudRate, usesRtsCts } =
            FakeUsbDevice.callsToConstructor[0] ?? {}

        assert.isEqualDeep(
            { serialNumber, baudRate, usesRtsCts },
            {
                serialNumber: this.serialNumber,
                baudRate: 1000000,
                usesRtsCts: true,
            },
            'Did not create USB controller with serial number and port settings!'
        )
    }

    @test()
    protected static async createsUsbControllerWithoutSerialNumberWhenNotGiven() {
        FakeUsbDevice.resetTestDouble()
        await CgxDeviceController.Create()

        assert.isUndefined(
            FakeUsbDevice.callsToConstructor[0]?.serialNumber,
            'Should not have passed a serial number!'
        )
    }

    @test()
    protected static async callsConnectOnUsbController() {
        await this.connect()

        assert.isEqual(
            FakeUsbDevice.numCallsToConnect,
            1,
            'Did not call connect!'
        )
    }

    @test()
    protected static async disconnectCallsDisconnectOnUsbController() {
        await this.connect()
        await this.disconnect()

        assert.isEqual(
            FakeUsbDevice.numCallsToDisconnect,
            1,
            'Did not call disconnect!'
        )
    }

    @test()
    protected static async writesNothingToDeviceOnConnect() {
        await this.connect()

        assert.isLength(
            FakeUsbDevice.callsToWriteUsb,
            0,
            'Should not write to device on connect!'
        )
    }

    @test()
    protected static async writesSeventeenToDeviceToTurnOnImpedanceWhenStreaming() {
        await this.connectAndStartStreaming()

        assert.isEqualDeep(
            FakeUsbDevice.callsToWriteUsb.map((value) =>
                Array.from(Buffer.from(value))
            ),
            [[0x11]],
            'Did not write 0x11 to device to turn on impedance check!'
        )
    }

    @test()
    protected static async createConstructsLslOutletforEEG() {
        assert.isEqualDeep(
            FakeLslOutlet.callsToConstructor[0],
            {
                sourceId: 'cgx-eeg',
                name: 'CGX Quick-20r (Cognionics) EEG',
                type: 'EEG',
                channelNames: this.eegCharacteristicNames,
                sampleRateHz: 500,
                channelFormat: 'float32',
                manufacturer: 'CGX Systems',
                units: 'microvolt',
                chunkSize: 1,
            },
            'Should create an LslOutlet!'
        )
    }

    @test()
    protected static async createConstructsLslOutletforAccelerometer() {
        assert.isEqualDeep(
            FakeLslOutlet.callsToConstructor[1],
            {
                sourceId: 'cgx-accel',
                name: 'CGX Quick-20r (Cognionics) Accelerometer',
                type: 'ACCEL',
                channelNames: this.accelCharacteristicNames,
                sampleRateHz: 500,
                channelFormat: 'float32',
                manufacturer: 'CGX Systems',
                units: 'Unknown',
                chunkSize: 1,
            },
            'Should create an LslOutlet!'
        )
    }

    @test()
    protected static async pushesEegDataToLslOutlet() {
        const packet = this.generatePacketWithRandomData()

        await this.connectAndStartStreaming()
        this.receive(packet, packet)

        const eegData = this.expectedEegDataFor(packet)

        assert.isEqualDeep(
            [this.pushedSamples[0], this.pushedSamples[2]],
            [eegData, eegData],
            'Should push EEG data to LSL outlet!'
        )
    }

    @test()
    protected static async pushesAccelerometerDataToLslOutlet() {
        const packet = this.generatePacketWithRandomData()

        await this.connectAndStartStreaming()
        this.receive(packet, packet)

        const accelData = this.expectedAccelDataFor(packet)

        assert.isEqualDeep(
            [this.pushedSamples[1], this.pushedSamples[3]],
            [accelData, accelData],
            'Should push accelerometer data to LSL outlet!'
        )
    }

    @test()
    protected static async doesNotPushSamplesBeforeStreaming() {
        await this.connect()
        this.receive(this.generatePacket())

        assert.isLength(
            this.pushedSamples,
            0,
            'Should not push samples before streaming!'
        )
    }

    @test()
    protected static async stopsPushingSamplesAfterStopStreaming() {
        await this.connectAndStartStreaming()
        await this.stopStreaming()

        this.receive(this.generatePacket())

        assert.isLength(
            this.pushedSamples,
            0,
            'Should not push samples after streaming stopped!'
        )
    }

    @test()
    protected static async waitsForRestOfPacketBeforePushing() {
        await this.connectAndStartStreaming()

        this.receive(this.generatePacket().subarray(0, 30))

        assert.isLength(
            this.pushedSamples,
            0,
            'Should not push a sample from a partial packet!'
        )
    }

    @test()
    protected static async reassemblesPacketSplitAcrossReads() {
        const packet = this.generatePacketWithRandomData()

        await this.connectAndStartStreaming()
        this.receive(packet.subarray(0, 30))
        this.receive(packet.subarray(30))

        assert.isEqualDeep(
            this.pushedSamples,
            [
                this.expectedEegDataFor(packet),
                this.expectedAccelDataFor(packet),
            ],
            'Did not reassemble packet split across reads!'
        )
    }

    @test()
    protected static async handlesSeveralPacketsInOneRead() {
        await this.connectAndStartStreaming()

        this.receive(
            Buffer.concat([
                this.generatePacket(0),
                this.generatePacket(1),
                this.generatePacket(2),
            ])
        )

        assert.isLength(
            this.pushedSamples,
            6,
            'Did not handle several packets in one read!'
        )
    }

    @test()
    protected static async skipsBytesBeforeFirstHeader() {
        const packet = this.generatePacketWithRandomData()

        await this.connectAndStartStreaming()
        this.receive(Buffer.concat([Buffer.from([0x00, 0x12, 0x34]), packet]))

        assert.isEqualDeep(
            this.pushedSamples,
            [
                this.expectedEegDataFor(packet),
                this.expectedAccelDataFor(packet),
            ],
            'Did not skip bytes before first header!'
        )
    }

    @test()
    protected static async skipsLongRunOfBytesBeforeHeaderInSameRead() {
        const packet = this.generatePacketWithRandomData()

        await this.connectAndStartStreaming()
        this.receive(Buffer.concat([Buffer.alloc(100, 0x01), packet]))

        assert.isEqualDeep(
            this.pushedSamples,
            [
                this.expectedEegDataFor(packet),
                this.expectedAccelDataFor(packet),
            ],
            'Did not skip long run of bytes before header in same read!'
        )
    }

    @test()
    protected static async ignoresBytesWithoutAnyHeader() {
        const packet = this.generatePacketWithRandomData()

        await this.connectAndStartStreaming()
        this.receive(Buffer.alloc(200, 0x01))
        this.receive(packet)

        assert.isEqualDeep(
            this.pushedSamples,
            [
                this.expectedEegDataFor(packet),
                this.expectedAccelDataFor(packet),
            ],
            'Did not ignore bytes without any header!'
        )
    }

    @test()
    protected static async discardsTruncatedPacketAndRealignsOnNextHeader() {
        const truncated = this.generatePacket().subarray(0, 20)
        const packet = this.generatePacketWithRandomData()

        await this.connectAndStartStreaming()
        this.receive(Buffer.concat([truncated, packet]))

        assert.isEqualDeep(
            this.pushedSamples,
            [
                this.expectedEegDataFor(packet),
                this.expectedAccelDataFor(packet),
            ],
            'Did not discard truncated packet and realign on next header!'
        )
    }

    @test()
    protected static async acceptsHeaderValueInBatteryAndTriggerBytes() {
        const packet = this.generatePacket(0)
        packet.fill(0xff, 75, 78)

        await this.connectAndStartStreaming()
        this.receive(packet, this.generatePacket(1))

        assert.isLength(
            this.pushedSamples,
            4,
            'Did not accept header value in battery and trigger bytes!'
        )
    }

    @test()
    protected static async incrementsNumPacketsDroppedWhenPacketCounterIsNonSequential() {
        await this.connect()
        this.receive(this.generatePacket(0), this.generatePacket(2))

        assert.isEqual(this.instance.getNumPacketsDropped(), 1)
    }

    @test()
    protected static async warnsWhenPacketIsDropped() {
        await this.connect()
        this.receive(this.generatePacket(0), this.generatePacket(2))

        assert.isEqual(
            this.callsToWarn[0]?.[0],
            'Dropped packet 2 / 1',
            'Did not warn when packet was dropped!'
        )
    }

    @test()
    protected static async recoversFromDroppedPackets() {
        await this.connect()

        this.receive(
            this.generatePacket(0),
            this.generatePacket(2),
            this.generatePacket(3),
            this.generatePacket(4)
        )

        assert.isEqual(this.instance.getNumPacketsDropped(), 1)
    }

    @test()
    protected static async resetsPacketCounterAt127() {
        await this.connect()
        this.receive(this.generatePacket(0x7f), this.generatePacket(0x00))

        assert.isEqual(this.instance.getNumPacketsDropped(), 0)
    }

    @test()
    protected static async exposesStreamQueriesReadonlyField() {
        assert.isEqualDeep(
            this.instance.streamQueries,
            ['type="EEG"', 'type="ACCEL"'],
            'Should expose stream queries!'
        )
    }

    @test()
    protected static async exposesLslOutlets() {
        assert.isEqual(
            this.instance.outlets.length,
            2,
            'Did not expose outlets!'
        )
    }

    private static async connectAndStartStreaming() {
        await this.connect()
        await this.startStreaming()
    }

    private static receive(...chunks: Buffer[]) {
        const { onData } = FakeUsbDevice.callsToConstructor.at(-1)!
        chunks.forEach((chunk) => onData(chunk, chunk.length, 0))
    }

    private static get pushedSamples() {
        return FakeLslOutlet.callsToPushSample.map((call) => call.sample)
    }

    private static generatePacket(packetCounter = 0) {
        const packet = Buffer.alloc(this.bytesPerPacket)
        packet[0] = 0xff
        packet[1] = packetCounter
        return packet
    }

    private static generatePacketWithRandomData() {
        const packet = this.generatePacket()

        for (let i = 2; i < 74; i++) {
            packet[i] = Math.floor(Math.random() * 254)
        }

        return packet
    }

    private static expectedEegDataFor(packet: Buffer) {
        return this.eegCharacteristicNames.map((_, i) => {
            const rawValue =
                ((packet[2 + i * 3] << 24) >>> 0) +
                ((packet[3 + i * 3] << 17) >>> 0) +
                ((packet[4 + i * 3] << 10) >>> 0)

            return rawValue * (5.0 / 3.0) * (1.0 / Math.pow(2, 32))
        })
    }

    private static expectedAccelDataFor(packet: Buffer) {
        return this.accelCharacteristicNames.map((_, i) => {
            const rawValue =
                ((packet[65 + i * 3] << 24) >>> 0) +
                ((packet[66 + i * 3] << 17) >>> 0) +
                ((packet[67 + i * 3] << 10) >>> 0)

            return rawValue * 2.5 * (1.0 / Math.pow(2, 32))
        })
    }

    private static readonly bytesPerPacket = 78

    private static readonly eegCharacteristicNames = [
        'F7',
        'Fp1',
        'Fp2',
        'F8',
        'F3',
        'Fz',
        'F4',
        'C3',
        'Cz',
        'P8',
        'P7',
        'Pz',
        'P4',
        'T3',
        'P3',
        'O1',
        'O2',
        'C4',
        'T4',
        'A2',
        'A1',
    ]

    private static readonly accelCharacteristicNames = [
        'X_ACCEL',
        'Y_ACCEL',
        'Z_ACCEL',
    ]

    protected static async ControllerWithLogLevel(logLevel: LogLevel) {
        return await this.CgxDeviceController({ logLevel })
    }

    private static async CgxDeviceController(
        options?: Partial<CgxControllerOptions>
    ) {
        return (await CgxDeviceController.Create({
            serialNumber: this.serialNumber,
            xdfRecordPath: this.xdfRecordPath,
            ...options,
        })) as SpyCgxController
    }
}
