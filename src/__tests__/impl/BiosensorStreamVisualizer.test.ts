import AbstractModuleTest, { test, assert } from '@neurodevs/node-tdd'

import BiosensorStreamVisualizer, {
    StreamVisualizer,
} from '../../impl/BiosensorStreamVisualizer.js'

export default class BiosensorStreamVisualizerTest extends AbstractModuleTest {
    private static instance: StreamVisualizer

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.BiosensorStreamVisualizer()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static BiosensorStreamVisualizer() {
        return BiosensorStreamVisualizer.Create()
    }
}
