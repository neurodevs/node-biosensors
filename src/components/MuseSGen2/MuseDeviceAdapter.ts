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
        const { bleUuid, rssiIntervalMs, xdfRecordPath } = options ?? {}

        const producer = await this.MuseStreamProducer({
            bleUuid,
            rssiIntervalMs,
        })

        const recorder = this.createXdfRecorderIfGivenPath(xdfRecordPath)

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

    public async stopStreaming() {
        this.stopXdfRecorderIfEnabled()
        await this.stopLslStreams()
    }

    private stopXdfRecorderIfEnabled() {
        this.xdfRecorder?.stop()
    }

    private async stopLslStreams() {
        await this.lslProducer.stopLslStreams()
    }

    public async disconnect() {
        await this.stopStreaming()
        await this.disconnectBle()
    }

    private async disconnectBle() {
        await this.lslProducer.disconnectBle()
    }

    private static MuseStreamProducer(options?: MuseAdapterOptions) {
        return MuseStreamProducer.Create(options)
    }

    private static createXdfRecorderIfGivenPath(xdfRecordPath?: string) {
        return xdfRecordPath
            ? MuseStreamRecorder.Create(xdfRecordPath)
            : undefined
    }
}

export interface MuseAdapter {
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
}

export interface MuseAdapterOptions {
    bleUuid?: string
    rssiIntervalMs?: number
    xdfRecordPath?: string
}

export type MuseAdapterConstructor = new () => MuseAdapter
