import { test, assert, errorAssert } from '@sprucelabs/test-utils'
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
        FakeDeviceFTDI.fakeReadPackets = this.generateTwoValidPackets()
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

    private static async startLslStreams() {
        await this.instance.startLslStreams()
    }

    private static generateFakePacket(numEmptyBytes: number) {
        const packet = this.generateEmptyPacket(numEmptyBytes)
        return this.prependHeaderToPacket(packet)
    }

    private static generateEmptyPacket(numEmptyBytes: number) {
        return Array.from({ length: numEmptyBytes }, () => 0x00)
    }

    private static prependHeaderToPacket(packet: number[]) {
        return new Uint8Array([0xff].concat(packet))
    }

    private static generateTwoValidPackets() {
        return [this.generateValidPacket(), this.generateValidPacket()]
    }

    private static generateValidPacket() {
        return this.generateFakePacket(this.bytesPerSample - 1)
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
            this.generateValidPacket(),
        ]
    }

    private static readonly bytesPerSample = 78

    private static async CgxStreamProducer() {
        return (await CgxStreamProducer.Create()) as SpyCgxProducer
    }
}
