export interface LslProducer {
    startLslStreams(): Promise<void>
    stopLslStreams(): Promise<void>
}

export interface LslProducerOptions {
    bleUuid?: string
    rssiIntervalMs?: number
}
