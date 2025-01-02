import { assertOptions } from '@sprucelabs/schema'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

export default class MuseStreamRecorder implements MuseXdfRecorder {
    public static Class?: MuseXdfRecorderConstructor

    private xdfRecorder: XdfRecorder

    protected constructor(xdfRecorder: XdfRecorder) {
        this.xdfRecorder = xdfRecorder
    }

    public static Create(xdfRecordPath: string) {
        assertOptions({ xdfRecordPath }, ['xdfRecordPath'])
        const recorder = this.XdfStreamRecorder(xdfRecordPath)
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

    private static XdfStreamRecorder(xdfRecordPath: string) {
        return XdfStreamRecorder.Create(xdfRecordPath, this.museStreamQueries)
    }
}

export interface MuseXdfRecorder {
    start(): void
    stop(): void
}

export type MuseXdfRecorderConstructor = new (
    xdfRecorder: XdfRecorder
) => MuseXdfRecorder
