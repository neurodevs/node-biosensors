import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import MuseStreamRecorder from '../components/Muse/MuseStreamRecorder'
import { StreamRecorder } from '../types'

export default class MuseStreamRecorderTest extends AbstractSpruceTest {
    private static instance: StreamRecorder

    protected static async beforeEach() {
        await super.beforeEach()
        this.instance = this.MuseStreamRecorder()
    }

    @test()
    protected static async canCreateMuseStreamRecorder() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    private static MuseStreamRecorder() {
        return MuseStreamRecorder.Create()
    }
}
