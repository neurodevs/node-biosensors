import { XdfRecorder } from '@neurodevs/node-xdf'

import { DeviceController } from './BiosensorDeviceFactory.js'

export default abstract class AbstractDeviceController implements DeviceController {
    protected readonly recorder?: XdfRecorder

    protected isConnected = false
    protected isStreaming = false

    protected constructor(recorder?: XdfRecorder) {
        this.recorder = recorder
    }

    public async connect() {
        if (this.isConnected) {
            console.warn(`Already connected to ${this.deviceId}.`)
            return
        }
        this.isConnected = true

        this.recorder?.start()
        await this.handleConnect()
    }

    public async startStreaming() {
        if (this.isStreaming) {
            console.warn(`Already streaming from ${this.deviceId}.`)
            return
        }
        this.isStreaming = true

        await this.handleStartStreaming()
    }

    public async stopStreaming() {
        if (!this.isStreaming) {
            console.warn(`Already not streaming from ${this.deviceId}.`)
            return
        }
        this.isStreaming = false

        await this.handleStopStreaming()
    }

    public async disconnect() {
        if (!this.isConnected) {
            console.warn(`Already disconnected from ${this.deviceId}.`)
            return
        }
        if (this.isStreaming) {
            await this.stopStreaming()
        }
        this.isConnected = false

        await this.handleDisconnect()
        this.recorder?.finish()
    }

    public get outlets() {
        return []
    }

    public abstract get streamQueries(): string[]

    protected abstract get deviceId(): string

    protected abstract handleConnect(): Promise<void>

    protected abstract handleDisconnect(): Promise<void>

    protected abstract handleStartStreaming(): Promise<void>

    protected abstract handleStopStreaming(): Promise<void>
}
