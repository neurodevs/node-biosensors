import { assertOptions } from '@sprucelabs/schema'
import { XdfStreamRecorder } from '@neurodevs/node-xdf'

export default class MuseStreamRecorder implements StreamRecorder {
    public static Class?: StreamRecorderConstructor

    protected constructor() {}

    public static Create(xdfSavePath: string) {
        assertOptions({ xdfSavePath }, ['xdfSavePath'])
        this.XdfStreamRecorder(xdfSavePath)
        return new (this.Class ?? this)()
    }

    private static readonly museStreamQueries = [
        'type="EEG"',
        'type="PPG"',
        'type="Markers"',
    ]

    private static XdfStreamRecorder(xdfSavePath: string) {
        XdfStreamRecorder.Create(xdfSavePath, this.museStreamQueries)
    }
}

export interface StreamRecorder {}

export type StreamRecorderConstructor = new () => StreamRecorder
