import { StreamRecorder, StreamRecorderConstructor } from '../types'

export default class MuseStreamRecorder implements StreamRecorder {
    public static Class?: StreamRecorderConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}
