import AbstractSpruceTest, {
    test,
    assert,
    errorAssert,
    generateId,
} from '@sprucelabs/test-utils'
import { FakeXdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'
import MuseStreamRecorder, {
    StreamRecorder,
} from '../components/Muse/MuseStreamRecorder'

export default class MuseStreamRecorderTest extends AbstractSpruceTest {
    private static instance: StreamRecorder

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeXdfRecorder()

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

    @test()
    protected static async createsXdfStreamRecorderWithCorrectOptions() {
        const { savePath, streamQueries } = this.xdfRecorderOptions

        assert.isEqual(savePath, this.xdfSavePath, 'Invalid save path!')

        assert.isEqualDeep(
            streamQueries,
            this.streamQueries,
            'Invalid stream queries!'
        )
    }

    @test()
    protected static async callingStartCallsStartOnXdfRecorder() {
        this.start()

        assert.isEqual(
            FakeXdfRecorder.numCallsToStart,
            1,
            'Should call start on XdfStreamRecorder!'
        )
    }

    @test()
    protected static async callingStopCallsStopOnXdfRecorder() {
        this.start()
        this.stop()

        assert.isEqual(
            FakeXdfRecorder.numCallsToStop,
            1,
            'Should call start on XdfStreamRecorder!'
        )
    }

    private static start() {
        this.instance.start()
    }

    private static stop() {
        this.instance.stop()
    }

    private static readonly xdfSavePath = generateId()

    private static readonly streamQueries = [
        'type="EEG"',
        'type="PPG"',
        'type="Markers"',
    ]

    private static get xdfRecorderOptions() {
        return FakeXdfRecorder.callsToConstructor[0]
    }

    private static setFakeXdfRecorder() {
        XdfStreamRecorder.Class = FakeXdfRecorder
        FakeXdfRecorder.resetTestDouble()
    }

    private static MuseStreamRecorder() {
        return MuseStreamRecorder.Create(this.xdfSavePath)
    }
}
