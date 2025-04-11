import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'
import {
    DeviceAdapter,
    DeviceAdapterConstructor,
    DeviceAdapterOptions,
} from '../../types'
import MuseStreamProducer, { MuseLslProducer } from './MuseStreamProducer'

export default class MuseDeviceAdapter implements DeviceAdapter {
    public static Class?: DeviceAdapterConstructor

    private lslProducer: MuseLslProducer
    private xdfRecorder?: XdfRecorder
    private _isRunning = false

    protected constructor(producer: MuseLslProducer, recorder?: XdfRecorder) {
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
        await this.disconnectMuseLslProducer()
        this.stopXdfRecorderIfEnabled()
    }

    private async disconnectMuseLslProducer() {
        await this.lslProducer.disconnect()
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

    private static readonly museStreamQueries = [
        'type="EEG"',
        'type="PPG"',
        'type="Markers"',
    ]

    private static createXdfRecorderIfGivenPath(xdfRecordPath?: string) {
        return xdfRecordPath ? this.XdfStreamRecorder(xdfRecordPath) : undefined
    }

    private static MuseStreamProducer(options?: DeviceAdapterOptions) {
        return MuseStreamProducer.Create(options)
    }

    private static XdfStreamRecorder(xdfRecordPath: string) {
        return XdfStreamRecorder.Create(xdfRecordPath, this.museStreamQueries)
    }
}
