import { LslProducer } from '../types'
import MuseStreamProducer from './MuseStreamProducer'
import MuseStreamRecorder, { MuseXdfRecorder } from './MuseStreamRecorder'

export default class MuseDeviceAdapter implements MuseAdapter {
    public static Class?: MuseAdapterConstructor

    private lslProducer: LslProducer
    private xdfRecorder?: MuseXdfRecorder

    protected constructor(producer: LslProducer, recorder?: MuseXdfRecorder) {
        this.lslProducer = producer
        this.xdfRecorder = recorder
    }

    public static async Create(options?: MuseAdapterOptions) {
        const { xdfRecordPath, ...producerOptions } = options ?? {}

        const producer = await this.MuseStreamProducer(producerOptions)
        const recorder = this.createXdfRecorderIfGivenPath(xdfRecordPath)

        return new (this.Class ?? this)(producer, recorder)
    }

    public async startStreaming() {
        this.startXdfRecorderIfEnabled()
        await this.startLslStreams()
    }

    private startXdfRecorderIfEnabled() {
        if (!this.recorderIsRunning) {
            this.xdfRecorder?.start()
        }
    }

    private get recorderIsRunning() {
        return this.xdfRecorder?.isRunning
    }

    private async startLslStreams() {
        await this.lslProducer.startLslStreams()
    }

    public async stopStreaming() {
        await this.stopLslStreams()
    }

    private async stopLslStreams() {
        await this.lslProducer.stopLslStreams()
    }

    public async disconnect() {
        await this.stopStreaming()
        this.stopXdfRecorderIfEnabled()
    }

    private stopXdfRecorderIfEnabled() {
        this.xdfRecorder?.stop()
    }

    public get bleUuid() {
        return this.lslProducer.bleUuid
    }

    private static createXdfRecorderIfGivenPath(xdfRecordPath?: string) {
        return xdfRecordPath
            ? this.MuseStreamRecorder(xdfRecordPath)
            : undefined
    }

    private static MuseStreamProducer(options?: MuseAdapterOptions) {
        return MuseStreamProducer.Create(options)
    }

    private static MuseStreamRecorder(xdfRecorderPath: string) {
        return MuseStreamRecorder.Create(xdfRecorderPath)
    }
}

export interface MuseAdapter {
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
    readonly bleUuid: string
}

export interface MuseAdapterOptions {
    bleUuid?: string
    rssiIntervalMs?: number
    xdfRecordPath?: string
}

export type MuseAdapterConstructor = new () => MuseAdapter
