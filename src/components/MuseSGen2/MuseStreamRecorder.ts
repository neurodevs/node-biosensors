import { assertOptions } from '@sprucelabs/schema'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

export default class MuseStreamRecorder implements StreamRecorder {
    public static Class?: StreamRecorderConstructor

    private xdfRecorder: XdfRecorder

    protected constructor(xdfRecorder: XdfRecorder) {
        this.xdfRecorder = xdfRecorder
    }

    public static Create(xdfSavePath: string) {
        assertOptions({ xdfSavePath }, ['xdfSavePath'])
        const recorder = this.XdfStreamRecorder(xdfSavePath)
        return new (this.Class ?? this)(recorder)
    }

    public start() {
        this.xdfRecorder.start()
    }

    public stop() {
        this.xdfRecorder.stop()
    }

    private static readonly museStreamQueries = [
        'type="EEG"',
        'type="PPG"',
        'type="Markers"',
    ]

    private static XdfStreamRecorder(xdfSavePath: string) {
        return XdfStreamRecorder.Create(xdfSavePath, this.museStreamQueries)
    }
}

export interface StreamRecorder {
    start(): void
    stop(): void
}

export type StreamRecorderConstructor = new (
    xdfRecorder: XdfRecorder
) => StreamRecorder
