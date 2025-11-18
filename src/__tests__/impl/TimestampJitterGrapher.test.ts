import { test, assert } from '@neurodevs/node-tdd'

import { FakeXdfLoader } from '@neurodevs/node-xdf'
import TimestampJitterGrapher, {
    JitterGrapher,
} from '../../impl/TimestampJitterGrapher.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class TimestampJitterGrapherTest extends AbstractPackageTest {
    private static instance: JitterGrapher

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = await this.TimestampJitterGrapher()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsXdfFileLoader() {
        assert.isEqual(
            FakeXdfLoader.numConstructorCalls,
            1,
            'Did not create XdfFileLoader!'
        )
    }

    @test()
    protected static async runLoadsXdfFileFromGivenPath() {
        await this.run()

        assert.isEqual(
            FakeXdfLoader.callsToLoad[0].filePath,
            this.xdfInputPath,
            'Did not load XDF file from given path!'
        )
    }

    private static async run() {
        await this.instance.run()
    }

    private static readonly xdfInputPath = this.generateId()
    private static readonly outputDir = this.generateId()
    private static readonly sampleRateHz = 100 * Math.random()

    private static async TimestampJitterGrapher() {
        return TimestampJitterGrapher.Create({
            xdfInputPath: this.xdfInputPath,
            outputDir: this.outputDir,
            sampleRateHz: this.sampleRateHz,
        })
    }
}
