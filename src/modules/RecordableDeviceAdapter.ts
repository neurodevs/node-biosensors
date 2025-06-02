import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'
import {
    DeviceAdapter,
    DeviceAdapterConstructor,
    DeviceAdapterOptions,
} from '../types'
import MuseDeviceStreamer, { BleDeviceStreamer } from './MuseDeviceStreamer'

export default class RecordableDeviceAdapter implements DeviceAdapter {
    public static Class?: DeviceAdapterConstructor

    private streamer: BleDeviceStreamer
    private recorder?: XdfRecorder
    private _isRunning = false

    protected constructor(streamer: BleDeviceStreamer, recorder?: XdfRecorder) {
        this.streamer = streamer
        this.recorder = recorder
    }

    public static async Create(options?: DeviceAdapterOptions) {
        const { xdfRecordPath, ...streamerOptions } = options ?? {}

        const streamer = await this.MuseDeviceStreamer(streamerOptions)
        const recorder = this.createXdfRecorderIfGivenPath(xdfRecordPath)

        return new (this.Class ?? this)(streamer, recorder)
    }

    public async startStreaming() {
        this.startXdfRecorderIfEnabled()
        await this.startLslStreams()
        this._isRunning = true
    }

    private startXdfRecorderIfEnabled() {
        if (!this.recorderIsRunning) {
            this.recorder?.start()
        }
    }

    private get recorderIsRunning() {
        return this.recorder?.isRunning
    }

    private async startLslStreams() {
        await this.streamer.startStreaming()
    }

    public async stopStreaming() {
        await this.stopLslStreams()
        this._isRunning = false
    }

    private async stopLslStreams() {
        await this.streamer.stopStreaming()
    }

    public async disconnect() {
        await this.stopStreaming()
        await this.disconnectMuseDeviceStreamer()
        this.stopXdfRecorderIfEnabled()
    }

    private async disconnectMuseDeviceStreamer() {
        await this.streamer.disconnect()
    }

    private stopXdfRecorderIfEnabled() {
        this.recorder?.stop()
    }

    public get isRunning() {
        return this._isRunning
    }

    public get bleUuid() {
        return this.streamer.bleUuid
    }

    public get bleName() {
        return this.streamer.bleName
    }

    private static readonly museStreamQueries = [
        'type="EEG"',
        'type="PPG"',
        'type="Markers"',
    ]

    private static createXdfRecorderIfGivenPath(xdfRecordPath?: string) {
        return xdfRecordPath ? this.XdfStreamRecorder(xdfRecordPath) : undefined
    }

    private static MuseDeviceStreamer(options?: DeviceAdapterOptions) {
        return MuseDeviceStreamer.Create(options)
    }

    private static XdfStreamRecorder(xdfRecordPath: string) {
        return XdfStreamRecorder.Create(xdfRecordPath, this.museStreamQueries)
    }
}
