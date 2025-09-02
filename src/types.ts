export interface DeviceStreamer {
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
    readonly streamQueries: string[]
}

export interface DeviceStreamerOptions {
    xdfRecordPath?: string
}
