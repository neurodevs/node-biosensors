import generateId from '@neurodevs/generate-id'
import { FakeStreamOutlet } from '@neurodevs/node-lsl'
import { test, assert } from '@neurodevs/node-tdd'
import { FakeXdfRecorder } from '@neurodevs/node-xdf'
import FTDI from 'ftdi-d2xx'

import CgxDeviceStreamer from '../../../impl/devices/CgxDeviceStreamer.js'
import SpyCgxDeviceStreamer from '../../../testDoubles/DeviceStreamer/CgxDeviceStreamer/SpyCgxDeviceStreamer.js'
import FakeDeviceFTDI from '../../../testDoubles/FTDI/FakeDeviceFTDI.js'
import FakeFTDI from '../../../testDoubles/FTDI/FakeFTDI.js'
import AbstractPackageTest from '../../AbstractPackageTest.js'

export default class CgxDeviceStreamerTest extends AbstractPackageTest {
    private static instance: SpyCgxDeviceStreamer

    protected static async beforeEach() {
        await super.beforeEach()

        this.setSpyCgxDeviceStreamer()

        this.instance = await this.CgxDeviceStreamer()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async callsGetDeviceInfoListOnFtdi() {
        await this.startStreaming()
        assert.isEqual(FakeFTDI.numCallsToGetDeviceInfoList, 1)
    }

    @test()
    protected static async throwsIfFtdiDeviceNotFound() {
        FakeFTDI.fakeDeviceInfos = []

        const err = await assert.doesThrowAsync(() => this.startStreaming())

        assert.isTrue(
            err.message.includes(this.notFoundError),
            'Did not receive the expected error!'
        )
    }

    @test()
    protected static async callsOpenDeviceOnSerialNumber() {
        await this.startStreaming()

        assert.isEqualDeep(
            FakeFTDI.callsToOpenDevice[0],
            FakeFTDI.fakeDeviceInfos[0].serial_number
        )
    }

    @test()
    protected static async callsSetTimeoutsOnDevice() {
        await this.startStreaming()

        assert.isEqualDeep(FakeDeviceFTDI.callsToSetTimeouts[0], {
            txTimeoutMs: 1000,
            rxTimeoutMs: 1000,
        })
    }

    @test()
    protected static async callsPurgeOnDeviceToClearPreviousData() {
        await this.startStreaming()

        assert.isEqualDeep(FakeDeviceFTDI.callsToPurge[0], FTDI.FT_PURGE_RX)
    }

    @test()
    protected static async setsFlowControlOnDevice() {
        await this.startStreaming()

        assert.isEqualDeep(FakeDeviceFTDI.callsToSetFlowControl[0], {
            flowControl: FTDI.FT_FLOW_RTS_CTS,
            xOn: 0x11,
            xOff: 0x13,
        })
    }

    @test()
    protected static async setsBaudRateOnDevice() {
        await this.startStreaming()
        assert.isEqualDeep(FakeDeviceFTDI.callsToSetBaudRate[0], 1000000)
    }

    @test()
    protected static async setsDataCharacteristicsOnDevice() {
        await this.startStreaming()

        assert.isEqualDeep(FakeDeviceFTDI.callsToSetDataCharacteristics[0], {
            dataBits: FTDI.FT_BITS_8,
            stopBits: FTDI.FT_STOP_BITS_1,
            parity: FTDI.FT_PARITY_NONE,
        })
    }

    @test()
    protected static async setsLatencyTimerOnDevice() {
        await this.startStreaming()
        assert.isEqualDeep(FakeDeviceFTDI.callsToSetLatencyTimer[0], 4)
    }

    @test()
    protected static async startStreamingSetsIsRunningTrue() {
        await this.startStreaming()
        assert.isTrue(this.instance.isRunning)
    }

    @test()
    protected static async callsReadOnDeviceOnce() {
        await this.startStreaming()
        assert.isEqual(FakeDeviceFTDI.callsToRead[0], this.bytesPerSample)
    }

    @test()
    protected static async callsReadOnDeviceTwice() {
        FakeDeviceFTDI.fakeReadPackets = [
            this.generateCorrectSizePacket(),
            this.generateCorrectSizePacket(),
        ]

        await this.startStreaming()

        assert.isEqual(FakeDeviceFTDI.callsToRead.length, 2)
    }

    @test()
    protected static async incrementsNumPacketsDroppedWhenPacketCounterIsNonSequential() {
        FakeDeviceFTDI.fakeReadPackets = this.generateNonSequentialPackets()
        await this.startStreaming()

        assert.isEqual(this.instance.getNumPacketsDropped(), 1)
    }

    @test()
    protected static async recoversFromDroppedPackets() {
        FakeDeviceFTDI.fakeReadPackets = [
            ...this.generateNonSequentialPackets(),
            new Uint8Array(
                [0xff, 0x03].concat(
                    this.generateEmptyPacket(this.bytesPerSample - 2)
                )
            ),
            new Uint8Array(
                [0xff, 0x04].concat(
                    this.generateEmptyPacket(this.bytesPerSample - 2)
                )
            ),
        ]
        await this.startStreaming()

        assert.isEqual(this.instance.getNumPacketsDropped(), 1)
    }

    @test()
    protected static async resetsPacketCounterAt127() {
        FakeDeviceFTDI.fakeReadPackets = [
            new Uint8Array(
                [0xff, 0x7f].concat(
                    this.generateEmptyPacket(this.bytesPerSample - 2)
                )
            ),
            new Uint8Array(
                [0xff, 0x00].concat(
                    this.generateEmptyPacket(this.bytesPerSample - 2)
                )
            ),
        ]
        await this.startStreaming()

        assert.isEqual(this.instance.getNumPacketsDropped(), 0)
    }

    @test()
    protected static async fixesOffsetWhenFirstByteIsNotHeader() {
        FakeDeviceFTDI.fakeReadPackets = this.generateOffsetPacket()
        await this.startStreaming()

        assert.isEqual(FakeDeviceFTDI.callsToRead[1], 2)
    }

    @test()
    protected static async createConstructsLslOutletforEEG() {
        assert.isEqualDeep(
            FakeStreamOutlet.callsToConstructor[0],
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
    protected static async pushesEegDataToLslOutlet() {
        const rawBytes = this.generateRandomArray(
            this.eegCharacteristicNames.length * 3
        )

        const packet = this.prependHeaderToPacket([
            0,
            ...rawBytes,
            ...this.generateEmptyPacket(16),
        ])

        FakeDeviceFTDI.fakeReadPackets = [packet, packet]
        await this.startStreaming()

        const eegData = []

        for (let i = 0; i < this.eegCharacteristicNames.length; i++) {
            const firstByte = packet[2 + i * 3]
            const secondByte = packet[3 + i * 3]
            const thirdByte = packet[4 + i * 3]

            const rawValue =
                ((firstByte << 24) >>> 0) +
                ((secondByte << 17) >>> 0) +
                ((thirdByte << 10) >>> 0)

            const volts = rawValue * (5.0 / 3.0) * (1.0 / Math.pow(2, 32))
            eegData.push(volts)
        }

        assert.isEqualDeep(
            [
                FakeStreamOutlet.callsToPushSample[0].sample,
                FakeStreamOutlet.callsToPushSample[2].sample,
            ],
            [eegData, eegData],
            'Should push EEG data to LSL outlet!'
        )
    }

    @test()
    protected static async createConstructsLslOutletforAccelerometer() {
        assert.isEqualDeep(
            FakeStreamOutlet.callsToConstructor[1],
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
            'Should create an LslOutlet for accelerometer!'
        )
    }

    @test()
    protected static async pushesAccelerometerDataToLslOutlet() {
        const rawBytes = this.generateRandomArray(
            this.accelCharacteristicNames.length * 3
        )

        const packet = this.prependHeaderToPacket([
            0,
            ...this.generateEmptyPacket(60),
            ...rawBytes,
            ...this.generateEmptyPacket(7),
        ])

        FakeDeviceFTDI.fakeReadPackets = [packet, packet]
        await this.startStreaming()

        const accelData = []

        for (let i = 0; i < this.accelCharacteristicNames.length; i++) {
            const firstByte = packet[65 + i * 3]
            const secondByte = packet[66 + i * 3]
            const thirdByte = packet[67 + i * 3]

            const rawValue =
                ((firstByte << 24) >>> 0) +
                ((secondByte << 17) >>> 0) +
                ((thirdByte << 10) >>> 0)

            const volts = rawValue * 2.5 * (1.0 / Math.pow(2, 32))
            accelData.push(volts)
        }

        assert.isEqualDeep(
            [
                FakeStreamOutlet.callsToPushSample[1].sample,
                FakeStreamOutlet.callsToPushSample[3].sample,
            ],
            [accelData, accelData],
            'Should push EEG data to LSL outlet!'
        )
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
    protected static async createsXdfRecorderIfPassedPath() {
        await this.createStreamerWithRecorder()

        assert.isEqual(
            FakeXdfRecorder.callsToConstructor.length,
            1,
            'Should create XdfRecorder!'
        )
    }

    @test()
    protected static async passesXdfRecordPathToRecorder() {
        await this.createStreamerWithRecorder()

        const { xdfRecordPath } = FakeXdfRecorder.callsToConstructor[0] ?? {}
        assert.isEqual(xdfRecordPath, this.xdfRecordPath, 'Incorrect path!')
    }

    @test()
    protected static async passesStreamQueriesToRecorder() {
        await this.createStreamerWithRecorder()

        const { streamQueries } = FakeXdfRecorder.callsToConstructor[0] ?? {}

        assert.isEqualDeep(
            streamQueries,
            this.instance.streamQueries,
            'Incorrect stream queries!'
        )
    }

    @test()
    protected static async startStreamingCallsStartOnXdfRecorder() {
        const instance = await this.createStreamerWithRecorder()
        await instance.startStreaming()

        assert.isEqual(
            FakeXdfRecorder.numCallsToStart,
            1,
            'Should call start on XdfRecorder!'
        )
    }

    @test()
    protected static async stopStreamingCallsFinishOnXdfRecorder() {
        const instance = await this.createStreamerWithRecorder()
        await instance.stopStreaming()

        assert.isEqual(
            FakeXdfRecorder.numCallsToFinish,
            1,
            'Should call finish on XdfRecorder!'
        )
    }

    @test()
    protected static async disconnectCallsFinishOnXdfRecorder() {
        const instance = await this.createStreamerWithRecorder()
        await instance.startStreaming()
        await instance.disconnect()

        assert.isEqual(
            FakeXdfRecorder.numCallsToFinish,
            1,
            'Should call finish on XdfRecorder!'
        )
    }

    @test()
    protected static async disconnectReturnsEarlyIfNotRunning() {
        const instance = await this.createStreamerWithRecorder()
        await instance.startStreaming()
        await instance.disconnect()
        await instance.disconnect()

        assert.isEqual(
            FakeXdfRecorder.numCallsToFinish,
            1,
            'Should not call finish on XdfRecorder!'
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

    private static async startStreaming() {
        await this.instance.startStreaming()
    }

    private static generatePacketWithHeader(numEmptyBytes: number) {
        const packet = this.generateEmptyPacket(numEmptyBytes)
        return this.prependHeaderToPacket(packet)
    }

    private static generateEmptyPacket(numEmptyBytes: number) {
        return Array.from({ length: numEmptyBytes }, () => 0x00)
    }

    private static prependHeaderToPacket(packet: number[]) {
        return new Uint8Array([0xff].concat(packet))
    }

    private static generateCorrectSizePacket() {
        return this.generatePacketWithHeader(this.bytesPerSample - 1)
    }

    private static generateNonSequentialPackets() {
        const packetCounterZero = [0x00].concat(
            this.generateEmptyPacket(this.bytesPerSample - 2)
        )

        const packetCounterTwo = [0x02].concat(
            this.generateEmptyPacket(this.bytesPerSample - 2)
        )

        return [
            this.prependHeaderToPacket(packetCounterZero),
            this.prependHeaderToPacket(packetCounterTwo),
        ]
    }

    private static generateOffsetPacket() {
        return [
            new Uint8Array(
                [0x00, 0x00, 0xff].concat(
                    this.generateEmptyPacket(this.bytesPerSample - 3)
                )
            ),
            this.generateCorrectSizePacket(),
        ]
    }

    private static generateRandomArray(length: number) {
        return Array.from({ length }, () => Math.floor(Math.random() * 254))
    }

    private static readonly xdfRecordPath = generateId()
    private static readonly bytesPerSample = 78

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

    private static readonly notFoundError = `
        \n FTDI device not found for the CGX headset!
        \n Please make sure the Bluetooth dongle is connected and FTDI D2XX drivers are installed: 
        \n - https://ftdichip.com/drivers/d2xx-drivers/
        \n
    `

    private static async createStreamerWithRecorder() {
        return await this.CgxDeviceStreamer(this.xdfRecordPath)
    }

    private static async CgxDeviceStreamer(xdfRecordPath?: string) {
        return (await CgxDeviceStreamer.Create({
            xdfRecordPath,
        })) as SpyCgxDeviceStreamer
    }
}
