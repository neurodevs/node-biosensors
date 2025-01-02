import MuseStreamProducer, { MuseLslProducer } from './MuseStreamProducer'
import MuseStreamRecorder, { MuseXdfRecorder } from './MuseStreamRecorder'

export default class MuseDeviceAdapter implements MuseAdapter {
    public static Class?: MuseAdapterConstructor

    private lslProducer: MuseLslProducer
    private xdfRecorder?: MuseXdfRecorder

    protected constructor(
        producer: MuseLslProducer,
        recorder?: MuseXdfRecorder
    ) {
        this.lslProducer = producer
        this.xdfRecorder = recorder
    }

    public static async Create(options?: MuseAdapterOptions) {
        const { xdfRecordPath } = options ?? {}

        const producer = await this.MuseStreamProducer()

        let recorder: MuseXdfRecorder | undefined

        if (xdfRecordPath) {
            recorder = this.MuseStreamRecorder(xdfRecordPath)
        }

        return new (this.Class ?? this)(producer, recorder)
    }

    public async startStreaming() {
        this.startXdfRecorderIfEnabled()
        await this.startLslStreams()
    }

    private startXdfRecorderIfEnabled() {
        this.xdfRecorder?.start()
    }

    private async startLslStreams() {
        await this.lslProducer.startLslStreams()
    }

    private static MuseStreamProducer() {
        return MuseStreamProducer.Create()
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
