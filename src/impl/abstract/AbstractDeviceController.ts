import fs, { WriteStream } from 'node:fs'

import { LslOutlet } from '@neurodevs/node-lsl'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

import { DeviceState, DeviceController, LogLevel } from '../types.js'

export default abstract class AbstractDeviceController implements DeviceController {
    public static log = console
    public static createWriteStream = fs.createWriteStream

    protected readonly recorder?: XdfRecorder
    protected readonly txtStream?: WriteStream
    protected readonly logLevel: LogLevel

    protected state: DeviceState = 'disconnected'

    protected constructor(
        recorder?: XdfRecorder,
        txtStream?: WriteStream,
        logLevel: LogLevel = 'warn'
    ) {
        this.recorder = recorder
        this.txtStream = txtStream
        this.logLevel = logLevel
    }

    public async connect() {
        if (this.state !== 'disconnected') {
            this.warn(`Already connected to ${this.deviceId}.`)
            return
        }
        this.state = 'connected'

        this.recorder?.start()
        await this.handleConnect()
    }

    public async startStreaming() {
        if (this.state === 'disconnected') {
            this.warn(`Cannot stream from ${this.deviceId} before connecting.`)
            return
        }
        if (this.state === 'streaming') {
            this.warn(`Already streaming from ${this.deviceId}.`)
            return
        }
        this.state = 'streaming'

        await this.handleStartStreaming()
    }

    public async stopStreaming() {
        if (this.state !== 'streaming') {
            this.warn(`Already not streaming from ${this.deviceId}.`)
            return
        }
        this.state = 'connected'

        await this.handleStopStreaming()
    }

    public async disconnect() {
        if (this.state === 'disconnected') {
            this.warn(`Already disconnected from ${this.deviceId}.`)
            return
        }
        if (this.state === 'streaming') {
            await this.stopStreaming()
        }
        this.state = 'disconnected'

        await this.handleDisconnect()
        this.recorder?.finish()
    }

    public get outlets(): LslOutlet[] {
        return []
    }

    public abstract get streamQueries(): string[]

    protected abstract get deviceId(): string

    protected abstract handleConnect(): Promise<void>

    protected abstract handleStartStreaming(): Promise<void>

    protected abstract handleStopStreaming(): Promise<void>

    protected abstract handleDisconnect(): Promise<void>

    protected info(message: string) {
        if (this.logLevel === 'info') {
            this.log.info(message)
        }
    }

    protected warn(message: string) {
        if (this.logLevel !== 'silent') {
            this.log.warn(message)
        }
    }

    protected get log() {
        return AbstractDeviceController.log
    }

    protected writeTxt(message: string) {
        this.txtStream?.write(`${message}\n`)
    }

    protected static TxtRecordStream(txtRecordPath?: string) {
        return txtRecordPath
            ? this.createWriteStream(txtRecordPath, { flags: 'a' })
            : undefined
    }

    protected static async XdfStreamRecorder(
        xdfRecordPath?: string,
        streamQueries: string[] = []
    ) {
        return xdfRecordPath
            ? await XdfStreamRecorder.Create(xdfRecordPath, streamQueries)
            : undefined
    }
}
