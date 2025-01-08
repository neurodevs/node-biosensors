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
