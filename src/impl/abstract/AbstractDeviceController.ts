import fs, { WriteStream } from 'node:fs'

import { LslOutlet } from '@neurodevs/node-lsl'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

import { DeviceController } from '../BiosensorDeviceFactory.js'

export default abstract class AbstractDeviceController implements DeviceController {
    public static warn = console.warn
    public static createWriteStream = fs.createWriteStream

    protected readonly recorder?: XdfRecorder
    protected readonly txtStream?: WriteStream

    protected isConnected = false
    protected isStreaming = false

    protected constructor(recorder?: XdfRecorder, txtStream?: WriteStream) {
        this.recorder = recorder
        this.txtStream = txtStream
    }

    protected writeToTxtRecord(message: string) {
        this.txtStream?.write(`${message}\n`)
    }

    public async connect() {
        if (this.isConnected) {
            this.warn(`Already connected to ${this.deviceId}.`)
            return
        }
        this.isConnected = true

        this.recorder?.start()
        await this.handleConnect()
    }

    public async startStreaming() {
        if (this.isStreaming) {
            this.warn(`Already streaming from ${this.deviceId}.`)
            return
        }
        this.isStreaming = true

        await this.handleStartStreaming()
    }

    public async stopStreaming() {
        if (!this.isStreaming) {
            this.warn(`Already not streaming from ${this.deviceId}.`)
            return
        }
        this.isStreaming = false

        await this.handleStopStreaming()
    }

    public async disconnect() {
        if (!this.isConnected) {
            this.warn(`Already disconnected from ${this.deviceId}.`)
            return
        }
        if (this.isStreaming) {
            await this.stopStreaming()
        }
        this.isConnected = false

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

    private get warn() {
        return AbstractDeviceController.warn
    }

    protected static TxtRecordStream(txtRecordPath?: string) {
        return txtRecordPath
            ? this.createWriteStream(txtRecordPath, { flags: 'a' })
            : undefined
    }

    protected static async XdfStreamRecorder(
        xdfRecordPath: string,
        streamQueries: string[]
    ) {
        return await XdfStreamRecorder.Create(xdfRecordPath, streamQueries)
    }
}
