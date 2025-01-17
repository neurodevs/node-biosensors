import AbstractSpruceTest, {
    test,
    assert,
    errorAssert,
} from '@sprucelabs/test-utils'
import { FTDI_Device } from 'ftdi-d2xx'
import CgxStreamProducer from '../../components/Cgx/CgxStreamProducer'
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
        FakeFTDI.fakeDevices = []

        const err = await assert.doesThrowAsync(() => this.CgxStreamProducer())
        errorAssert.assertError(err, 'CGX_FTDI_DEVICE_NOT_FOUND')
    }

    private static setFakeFTDI() {
        CgxStreamProducer.FTDI = FakeFTDI as any
        FakeFTDI.resetTestDouble()

        FakeFTDI.fakeDevices = [{} as FTDI_Device]
    }

    private static async CgxStreamProducer() {
        return await CgxStreamProducer.Create()
    }
}
