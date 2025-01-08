export interface LslProducer {
    startLslStreams(): Promise<void>
    stopLslStreams(): Promise<void>
    readonly bleUuid: string
}

export interface LslProducerOptions {
    bleUuid?: string
    rssiIntervalMs?: number
}
