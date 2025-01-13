import {
    DeviceAdapter,
    DeviceAdapterConstructor,
    DeviceAdapterOptions,
    LslProducer,
} from '../../types'
import MuseStreamProducer from './MuseStreamProducer'
import MuseStreamRecorder, { MuseXdfRecorder } from './MuseStreamRecorder'

export default class MuseDeviceAdapter implements DeviceAdapter {
    public static Class?: DeviceAdapterConstructor

    private lslProducer: LslProducer
    private xdfRecorder?: MuseXdfRecorder
    private _isRunning = false

    protected constructor(producer: LslProducer, recorder?: MuseXdfRecorder) {
        this.lslProducer = producer
        this.xdfRecorder = recorder
    }

    public static async Create(options?: DeviceAdapterOptions) {
        const { xdfRecordPath, ...producerOptions } = options ?? {}

        const producer = await this.MuseStreamProducer(producerOptions)
        const recorder = this.createXdfRecorderIfGivenPath(xdfRecordPath)

        return new (this.Class ?? this)(producer, recorder)
    }

    public async startStreaming() {
        this.startXdfRecorderIfEnabled()
        await this.startLslStreams()
        this._isRunning = true
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
        this._isRunning = false
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

    public get isRunning() {
        return this._isRunning
    }

    public get bleUuid() {
        return this.lslProducer.bleUuid
    }

    public get bleName() {
        return this.lslProducer.bleName
    }

    private static createXdfRecorderIfGivenPath(xdfRecordPath?: string) {
        return xdfRecordPath
            ? this.MuseStreamRecorder(xdfRecordPath)
            : undefined
    }

    private static MuseStreamProducer(options?: DeviceAdapterOptions) {
        return MuseStreamProducer.Create(options)
    }

    private static MuseStreamRecorder(xdfRecorderPath: string) {
        return MuseStreamRecorder.Create(xdfRecorderPath)
    }
}
