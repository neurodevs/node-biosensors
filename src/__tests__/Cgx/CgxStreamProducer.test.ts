import { test, assert, errorAssert } from '@sprucelabs/test-utils'
import FTDI from 'ftdi-d2xx'
import CgxStreamProducer from '../../components/Cgx/CgxStreamProducer'
import SpyCgxProducer from '../../testDoubles/CgxProducer/SpyCgxProducer'
import FakeDeviceFTDI from '../../testDoubles/FTDI/FakeDeviceFTDI'
import FakeFTDI from '../../testDoubles/FTDI/FakeFTDI'
import AbstractBiosensorsTest from '../AbstractBiosensorsTest'

export default class CgxStreamProducerTest extends AbstractBiosensorsTest {
    private static instance: SpyCgxProducer

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeFTDI()
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
    protected static async callsReadOnDeviceOnce() {
        await this.startLslStreams()
        assert.isEqual(FakeDeviceFTDI.callsToRead[0], this.totalBytes)
    }

    @test()
    protected static async incrementsNumPacketsMissingHeader() {
        await this.startLslStreams()
        assert.isEqual(this.instance.getNumPacketsMissingHeader(), 1)
    }

    private static async startLslStreams() {
        await this.instance.startLslStreams()
    }

    private static setFakeFTDI() {
        CgxStreamProducer.FTDI = FakeFTDI as any
        FakeFTDI.resetTestDouble()

        FakeFTDI.setFakeDeviceInfos()
    }

    private static readonly chunkSize = 125
    private static readonly bytesPerChunk = 75
    private static readonly totalBytes = this.chunkSize * this.bytesPerChunk

    private static async CgxStreamProducer() {
        return (await CgxStreamProducer.Create()) as SpyCgxProducer
    }
}
