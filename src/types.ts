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

export interface DeviceStreamer {
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
    readonly streamQueries: string[]
}
