import AbstractSpruceTest, {
    test,
    assert,
    errorAssert,
    generateId,
} from '@sprucelabs/test-utils'
import MuseStreamRecorder, {
    StreamRecorder,
} from '../components/Muse/MuseStreamRecorder'

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

    @test()
    protected static async throwsWithMissingRequiredOptions() {
        // @ts-ignore
        const err = assert.doesThrow(() => MuseStreamRecorder.Create())

        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['xdfSavePath'],
        })
    }

    private static readonly xdfSavePath = generateId()

    private static MuseStreamRecorder() {
        return MuseStreamRecorder.Create(this.xdfSavePath)
    }
}
