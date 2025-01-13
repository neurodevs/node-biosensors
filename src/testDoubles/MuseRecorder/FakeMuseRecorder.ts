import { MuseXdfRecorder } from '../../components/Muse/MuseStreamRecorder'

export default class FakeMuseRecorder implements MuseXdfRecorder {
    public static numCallsToConstructor = 0
    public static numCallsToStart = 0
    public static numCallsToStop = 0

    public constructor() {
        FakeMuseRecorder.numCallsToConstructor++
    }

    public start() {
        FakeMuseRecorder.numCallsToStart++
        this.isRunning = true
    }

    public stop() {
        FakeMuseRecorder.numCallsToStop++
        this.isRunning = false
    }

    public isRunning = false

    public static resetTestDouble() {
        this.numCallsToConstructor = 0
        this.numCallsToStart = 0
        this.numCallsToStop = 0
    }
}
