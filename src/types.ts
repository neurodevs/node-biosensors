// DeviceAdapter

export interface DeviceAdapter {
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
    readonly isRunning: boolean
    readonly bleUuid: string
    readonly bleName: string
}

export interface DeviceAdapterOptions {
    bleUuid?: string
    rssiIntervalMs?: number
    xdfRecordPath?: string
}

export type DeviceAdapterConstructor = new () => DeviceAdapter

// LslProducer

export interface LslProducer {
    startLslStreams(): Promise<void>
    stopLslStreams(): Promise<void>
    readonly bleUuid: string
    readonly bleName: string
}

export interface LslProducerOptions {
    bleUuid?: string
    rssiIntervalMs?: number
}
