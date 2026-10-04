import fs, { WriteStream } from 'node:fs'

import { LslOutlet } from '@neurodevs/node-lsl'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

import DeviceStateEmitter from '../DeviceStateEmitter.js'
import {
    DeviceController,
    DeviceName,
    DeviceState,
    DeviceStateListener,
    DeviceControllerConstructorOptions,
    LogLevel,
    DEFAULT_LOG_LEVEL,
    DeviceControllerOptions,
} from '../../types.js'

export default abstract class AbstractDeviceController implements DeviceController {
    public static log = console
    public static createWriteStream = fs.createWriteStream

    public abstract readonly deviceName: DeviceName

    protected readonly recorder?: XdfRecorder
    protected readonly txtStream?: WriteStream
    protected readonly logLevel: LogLevel

    private readonly stateEmitter = new DeviceStateEmitter()

    protected constructor(options?: DeviceControllerConstructorOptions) {
        const {
            recorder,
            txtStream,
            logLevel = DEFAULT_LOG_LEVEL,
        } = options ?? {}

        this.recorder = recorder
        this.txtStream = txtStream
        this.logLevel = logLevel
    }

    public async connect() {
        if (this.state !== 'disconnected') {
            this.warn(`Already connected to ${this.deviceId}.`)
            return
        }
        this.setState('connecting')

        this.recorder?.start()

        try {
            await this.handleConnect()
        } catch (err) {
            this.setState('disconnected')
            throw err
        }

        this.setState('connected')
    }

    public async startStreaming() {
        if (this.state === 'disconnected' || this.state === 'connecting') {
            this.warn(`Cannot stream from ${this.deviceId} before connecting.`)
            return
        }
        if (this.state === 'streaming') {
            this.warn(`Already streaming from ${this.deviceId}.`)
            return
        }
        this.setState('streaming')

        await this.handleStartStreaming()
    }

    public async stopStreaming() {
        if (this.state !== 'streaming') {
            this.warn(`Already not streaming from ${this.deviceId}.`)
            return
        }
        this.setState('connected')

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

        await this.handleDisconnect()
        this.recorder?.finish()

        this.setState('disconnected')
    }

    public get state() {
        return this.stateEmitter.state
    }

    public addStateListener(listener: DeviceStateListener) {
        return this.stateEmitter.addStateListener(listener)
    }

    protected setState(state: DeviceState) {
        this.stateEmitter.setState(state)
    }

    public get outlets(): LslOutlet[] {
        return []
    }

    public abstract get streamQueries(): readonly string[]

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

    protected static resolveDisabledStreams<Stream extends string>(
        options: DeviceControllerOptions<Stream>
    ) {
        const { disableStreams } = options
        return new Set(disableStreams ?? [])
    }

    protected static TxtRecordStream(txtRecordPath?: string) {
        return txtRecordPath
            ? this.createWriteStream(txtRecordPath, { flags: 'a' })
            : undefined
    }

    protected static async XdfStreamRecorder(
        xdfRecordPath?: string,
        streamQueries: readonly string[] = []
    ) {
        return xdfRecordPath
            ? await XdfStreamRecorder.Create(xdfRecordPath, [...streamQueries])
            : undefined
    }
}
