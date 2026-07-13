import { test, assert } from '@neurodevs/node-tdd'

import MuseModelDetector, {
    MuseDetector,
} from '../../impl/muse/MuseModelDetector.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class MuseModelDetectorTest extends AbstractPackageTest {
    private static instance: MuseDetector

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = await this.MuseModelDetector()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static async MuseModelDetector() {
        return await MuseModelDetector.Create()
    }
}
