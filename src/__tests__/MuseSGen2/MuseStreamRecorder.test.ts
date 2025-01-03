import { test, assert, errorAssert, generateId } from '@sprucelabs/test-utils'
import { FakeXdfRecorder } from '@neurodevs/node-xdf'
import MuseStreamRecorder, {
    MuseXdfRecorder,
} from '../../components/MuseSGen2/MuseStreamRecorder'
import AbstractBiosensorsTest from '../AbstractBiosensorsTest'

export default class MuseStreamRecorderTest extends AbstractBiosensorsTest {
    private static instance: MuseXdfRecorder

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
            parameters: ['xdfRecordPath'],
        })
    }

    @test()
    protected static async createsXdfStreamRecorderWithCorrectOptions() {
        const { xdfRecordPath, streamQueries } = this.xdfRecorderOptions

        assert.isEqual(
            xdfRecordPath,
            this.xdfRecordPath,
            'Invalid xdfRecordPath!'
        )

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

    @test()
    protected static async passesIsRunningThroughFromXdfRecorder() {
        assert.isFalse(
            this.instance.isRunning,
            'isRunning should be false by default!'
        )
    }

    @test()
    protected static async callingStartSetsIsRunningToTrue() {
        this.start()
        assert.isTrue(this.instance.isRunning, 'isRunning should be true!')
    }

    private static start() {
        this.instance.start()
    }

    private static stop() {
        this.instance.stop()
    }

    private static get xdfRecorderOptions() {
        return FakeXdfRecorder.callsToConstructor[0]
    }

    private static readonly xdfRecordPath = generateId()

    private static readonly streamQueries = [
        'type="EEG"',
        'type="PPG"',
        'type="Markers"',
    ]

    private static MuseStreamRecorder() {
        return MuseStreamRecorder.Create(this.xdfRecordPath)
    }
}
