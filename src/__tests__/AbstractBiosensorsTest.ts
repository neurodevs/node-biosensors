import AbstractSpruceTest from '@sprucelabs/test-utils'
import { XdfStreamRecorder, FakeXdfRecorder } from '@neurodevs/node-xdf'

export default class AbstractBiosensorsTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeXdfRecorder()
    }

    protected static setFakeXdfRecorder() {
        XdfStreamRecorder.Class = FakeXdfRecorder
        FakeXdfRecorder.resetTestDouble()
    }
}
