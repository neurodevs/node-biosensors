import AbstractSpruceTest, {
    test,
    assert,
    errorAssert,
} from '@sprucelabs/test-utils'
import FTDI from 'ftdi-d2xx'
import CgxStreamProducer from '../../components/Cgx/CgxStreamProducer'
import FakeDeviceFTDI from '../../testDoubles/FTDI/FakeDeviceFTDI'
import FakeFTDI from '../../testDoubles/FTDI/FakeFTDI'
import { LslProducer } from '../../types'

export default class CgxStreamProducerTest extends AbstractSpruceTest {
    private static instance: LslProducer

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeFTDI()

        this.instance = await this.CgxStreamProducer()
    }

    @test()
    protected static async createsCgxStreamProducerInstance() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    @test()
    protected static async callsGetDeviceInfoListOnFtdi() {
        assert.isEqual(FakeFTDI.numCallsToGetDeviceInfoList, 1)
    }

    @test()
    protected static async throwsIfFtdiDeviceNotFound() {
        FakeFTDI.fakeDeviceInfos = []

        const err = await assert.doesThrowAsync(() => this.CgxStreamProducer())
        errorAssert.assertError(err, 'CGX_FTDI_DEVICE_NOT_FOUND')
    }

    @test()
    protected static async callsOpenDeviceOnSerialNumber() {
        assert.isEqualDeep(
            FakeFTDI.callsToOpenDevice[0],
            FakeFTDI.fakeDeviceInfos[0].serial_number
        )
    }

    @test()
    protected static async callsSetTimeoutsOnDevice() {
        assert.isEqualDeep(FakeDeviceFTDI.callsToSetTimeouts[0], {
            txTimeoutMs: 1000,
            rxTimeoutMs: 1000,
        })
    }

    @test()
    protected static async callsPurgeOnDeviceToClearPreviousData() {
        assert.isEqualDeep(FakeDeviceFTDI.callsToPurge[0], FTDI.FT_PURGE_RX)
    }

    private static setFakeFTDI() {
        CgxStreamProducer.FTDI = FakeFTDI as any
        FakeFTDI.resetTestDouble()

        FakeFTDI.setFakeDeviceInfos()
    }

    private static async CgxStreamProducer() {
        return await CgxStreamProducer.Create()
    }
}
