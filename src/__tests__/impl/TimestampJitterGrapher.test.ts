import AbstractSpruceTest, { test, assert } from '@neurodevs/node-tdd'

import TimestampJitterGrapher, {
    JitterGrapher,
} from '../../impl/TimestampJitterGrapher.js'

export default class TimestampJitterGrapherTest extends AbstractSpruceTest {
    private static instance: JitterGrapher

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.TimestampJitterGrapher()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static TimestampJitterGrapher() {
        return TimestampJitterGrapher.Create()
    }
}
