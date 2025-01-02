import MuseStreamRecorder from './MuseStreamRecorder'

export default class MuseDeviceAdapter implements MuseAdapter {
    public static Class?: MuseAdapterConstructor

    protected constructor() {}

    public static Create(options?: MuseAdapterOptions) {
        const { xdfRecordPath } = options ?? {}

        if (xdfRecordPath) {
            this.MuseStreamRecorder(xdfRecordPath)
        }

        return new (this.Class ?? this)()
    }

    private static MuseStreamRecorder(xdfRecordPath: string) {
        return MuseStreamRecorder.Create(xdfRecordPath)
    }
}

export interface MuseAdapter {}

export interface MuseAdapterOptions {
    xdfRecordPath?: string
}

export type MuseAdapterConstructor = new () => MuseAdapter
