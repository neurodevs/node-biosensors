import { LslOutlet } from '@neurodevs/node-lsl'

export interface DeviceStreamer {
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
    readonly outlets: LslOutlet[]
    readonly streamQueries: string[]
}

export interface DeviceStreamerOptions {
    xdfRecordPath?: string
}
