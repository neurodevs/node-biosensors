import { MuseRecorder } from '../../components/MuseSGen2/MuseStreamRecorder'

export default class FakeMuseRecorder implements MuseRecorder {
    public static callsToConstructor = 0
    public static callsToStart = 0
    public static callsToStop = 0

    public constructor() {
        FakeMuseRecorder.callsToConstructor++
    }

    public start() {
        FakeMuseRecorder.callsToStart++
    }

    public stop() {
        FakeMuseRecorder.callsToStop++
    }

    public static resetTestDouble() {
        this.callsToConstructor = 0
        this.callsToStart = 0
        this.callsToStop = 0
    }
}
