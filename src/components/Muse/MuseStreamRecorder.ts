import { assertOptions } from '@sprucelabs/schema'

export default class MuseStreamRecorder implements StreamRecorder {
    public static Class?: StreamRecorderConstructor

    protected constructor() {}

    public static Create(xdfSavePath: string) {
        assertOptions({ xdfSavePath }, ['xdfSavePath'])
        return new (this.Class ?? this)()
    }
}

export interface StreamRecorder {}

export type StreamRecorderConstructor = new () => StreamRecorder
