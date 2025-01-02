import MuseStreamRecorder, { MuseRecorder } from './MuseStreamRecorder'

export default class MuseDeviceAdapter implements MuseAdapter {
    public static Class?: MuseAdapterConstructor

    private xdfRecorder?: MuseRecorder

    protected constructor(recorder?: MuseRecorder) {
        this.xdfRecorder = recorder
    }

    public static Create(options?: MuseAdapterOptions) {
        const { xdfRecordPath } = options ?? {}

        let recorder: MuseRecorder | undefined

        if (xdfRecordPath) {
            recorder = this.MuseStreamRecorder(xdfRecordPath)
        }

        return new (this.Class ?? this)(recorder)
    }

    public startStreaming() {
        this.startXdfRecorderIfEnabled()
    }

    private startXdfRecorderIfEnabled() {
        this.xdfRecorder?.start()
    }

    private static MuseStreamRecorder(xdfRecordPath: string) {
        return MuseStreamRecorder.Create(xdfRecordPath)
    }
}

export interface MuseAdapter {
    startStreaming(): void
}

export interface MuseAdapterOptions {
    xdfRecordPath?: string
}

export type MuseAdapterConstructor = new () => MuseAdapter
