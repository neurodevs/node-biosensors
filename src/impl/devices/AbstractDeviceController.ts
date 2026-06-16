import { XdfRecorder } from '@neurodevs/node-xdf'

import { DeviceController } from '../BiosensorDeviceFactory.js'

export default abstract class AbstractDeviceController implements DeviceController {
    protected readonly recorder?: XdfRecorder

    protected isConnected = false
    protected isStreaming = false

    protected constructor(recorder?: XdfRecorder) {
        this.recorder = recorder
    }

    public async connect() {
        if (!this.isConnected) {
            this.recorder?.start()
            await this.handleConnect()
        } else {
            console.warn(`Already connected to ${this.deviceId}.`)
        }
        this.isConnected = true
    }

    public async startStreaming() {
        if (!this.isStreaming) {
            await this.handleStartStreaming()
        } else {
            console.warn(`Already streaming from ${this.deviceId}.`)
        }
        this.isStreaming = true
    }

    public async stopStreaming() {
        if (this.isStreaming) {
            await this.handleStopStreaming()
        } else {
            console.warn(`Not streaming from ${this.deviceId}.`)
        }
        this.isStreaming = false
    }

    public async disconnect() {
        if (this.isStreaming) {
            await this.stopStreaming()
        }
        if (this.isConnected) {
            await this.handleDisconnect()
            this.recorder?.finish()
        } else {
            console.warn(`Already disconnected from ${this.deviceId}.`)
        }
        this.isConnected = false
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
