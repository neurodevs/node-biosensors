import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
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

    private static setFakeFTDI() {
        CgxStreamProducer.FTDI = FakeFTDI as any
        FakeFTDI.resetTestDouble()
    }

    private static async CgxStreamProducer() {
        return await CgxStreamProducer.Create()
    }
}
