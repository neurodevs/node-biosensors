import { MuseRecorder } from '../../components/MuseSGen2/MuseStreamRecorder'

export default class FakeMuseRecorder implements MuseRecorder {
    public static numCallsToConstructor = 0
    public static numCallsToStart = 0
    public static numCallsToStop = 0

    public constructor() {
        FakeMuseRecorder.numCallsToConstructor++
    }

    public start() {
        FakeMuseRecorder.numCallsToStart++
    }

    public stop() {
        FakeMuseRecorder.numCallsToStop++
    }

    public static resetTestDouble() {
        this.numCallsToConstructor = 0
        this.numCallsToStart = 0
        this.numCallsToStop = 0
    }
}
