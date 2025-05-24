import { test, assert, errorAssert } from '@sprucelabs/test-utils'
import { FakeLslOutlet } from '@neurodevs/node-lsl'
import FTDI from 'ftdi-d2xx'
import CgxStreamProducer from '../modules/Cgx/CgxStreamProducer'
import SpyCgxProducer from '../testDoubles/CgxProducer/SpyCgxProducer'
import FakeDeviceFTDI from '../testDoubles/FTDI/FakeDeviceFTDI'
import FakeFTDI from '../testDoubles/FTDI/FakeFTDI'
import AbstractBiosensorsTest from './AbstractBiosensorsTest'

export default class CgxStreamProducerTest extends AbstractBiosensorsTest {
    private static instance: SpyCgxProducer

    protected static async beforeEach() {
        await super.beforeEach()

        this.setSpyCgxProducer()

        this.instance = await this.CgxStreamProducer()
    }

    @test()
    protected static async createsCgxStreamProducerInstance() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    @test()
    protected static async callsGetDeviceInfoListOnFtdi() {
        await this.startLslStreams()
        assert.isEqual(FakeFTDI.numCallsToGetDeviceInfoList, 1)
    }

    @test()
    protected static async throwsIfFtdiDeviceNotFound() {
        FakeFTDI.fakeDeviceInfos = []

        const err = await assert.doesThrowAsync(() => this.startLslStreams())
        errorAssert.assertError(err, 'CGX_FTDI_DEVICE_NOT_FOUND')
    }

    @test()
    protected static async callsOpenDeviceOnSerialNumber() {
        await this.startLslStreams()

        assert.isEqualDeep(
            FakeFTDI.callsToOpenDevice[0],
            FakeFTDI.fakeDeviceInfos[0].serial_number
        )
    }

    @test()
    protected static async callsSetTimeoutsOnDevice() {
        await this.startLslStreams()

        assert.isEqualDeep(FakeDeviceFTDI.callsToSetTimeouts[0], {
            txTimeoutMs: 1000,
            rxTimeoutMs: 1000,
        })
    }

    @test()
    protected static async callsPurgeOnDeviceToClearPreviousData() {
        await this.startLslStreams()

        assert.isEqualDeep(FakeDeviceFTDI.callsToPurge[0], FTDI.FT_PURGE_RX)
    }

    @test()
    protected static async setsFlowControlOnDevice() {
        await this.startLslStreams()

        assert.isEqualDeep(FakeDeviceFTDI.callsToSetFlowControl[0], {
            flowControl: FTDI.FT_FLOW_RTS_CTS,
            xOn: 0x11,
            xOff: 0x13,
        })
    }

    @test()
    protected static async setsBaudRateOnDevice() {
        await this.startLslStreams()
        assert.isEqualDeep(FakeDeviceFTDI.callsToSetBaudRate[0], 1000000)
    }

    @test()
    protected static async setsDataCharacteristicsOnDevice() {
        await this.startLslStreams()

        assert.isEqualDeep(FakeDeviceFTDI.callsToSetDataCharacteristics[0], {
            dataBits: FTDI.FT_BITS_8,
            stopBits: FTDI.FT_STOP_BITS_1,
            parity: FTDI.FT_PARITY_NONE,
        })
    }

    @test()
    protected static async setsLatencyTimerOnDevice() {
        await this.startLslStreams()
        assert.isEqualDeep(FakeDeviceFTDI.callsToSetLatencyTimer[0], 4)
    }

    @test()
    protected static async startLslStreamsSetsIsRunningTrue() {
        await this.startLslStreams()
        assert.isTrue(this.instance.isRunning)
    }

    @test()
    protected static async callsReadOnDeviceOnce() {
        await this.startLslStreams()
        assert.isEqual(FakeDeviceFTDI.callsToRead[0], this.bytesPerSample)
    }

    @test()
    protected static async callsReadOnDeviceTwice() {
        FakeDeviceFTDI.fakeReadPackets = [
            this.generateCorrectSizePacket(),
            this.generateCorrectSizePacket(),
        ]

        await this.startLslStreams()

        assert.isEqual(FakeDeviceFTDI.callsToRead.length, 2)
    }

    @test()
    protected static async incrementsNumPacketsDroppedWhenPacketCounterIsNonSequential() {
        FakeDeviceFTDI.fakeReadPackets = this.generateNonSequentialPackets()
        await this.startLslStreams()

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
        await this.startLslStreams()

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
        await this.startLslStreams()

        assert.isEqual(this.instance.getNumPacketsDropped(), 0)
    }

    @test()
    protected static async fixesOffsetWhenFirstByteIsNotHeader() {
        FakeDeviceFTDI.fakeReadPackets = this.generateOffsetPacket()
        await this.startLslStreams()

        assert.isEqual(FakeDeviceFTDI.callsToRead[1], 2)
    }

    @test()
    protected static async createConstructsLslOutletforEEG() {
        assert.isEqualDeep(
            FakeLslOutlet.callsToConstructor[0]?.options,
            {
                sourceId: 'cgx-eeg',
                name: 'CGX Quick-20r (Cognionics) - EEG',
                type: 'EEG',
                channelNames: this.eegCharacteristicNames,
                sampleRate: 500,
                channelFormat: 'float32',
                manufacturer: 'CGX Systems',
                unit: 'microvolt',
                chunkSize: 1,
                maxBuffered: 360,
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
        await this.startLslStreams()

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
                FakeLslOutlet.callsToPushSample[0],
                FakeLslOutlet.callsToPushSample[2],
            ],
            [eegData, eegData],
            'Should push EEG data to LSL outlet!'
        )
    }

    @test()
    protected static async createConstructsLslOutletforAccelerometer() {
        assert.isEqualDeep(
            FakeLslOutlet.callsToConstructor[1]?.options,
            {
                sourceId: 'cgx-accel',
                name: 'CGX Quick-20r (Cognionics) - Accelerometer',
                type: 'ACCEL',
                channelNames: this.accelCharacteristicNames,
                sampleRate: 500,
                channelFormat: 'float32',
                manufacturer: 'CGX Systems',
                unit: 'Unknown',
                chunkSize: 1,
                maxBuffered: 360,
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
        await this.startLslStreams()

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
                FakeLslOutlet.callsToPushSample[1],
                FakeLslOutlet.callsToPushSample[3],
            ],
            [accelData, accelData],
            'Should push EEG data to LSL outlet!'
        )
    }

    private static async startLslStreams() {
        await this.instance.startLslStreams()
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

    private static async CgxStreamProducer() {
        return (await CgxStreamProducer.Create()) as SpyCgxProducer
    }
}
