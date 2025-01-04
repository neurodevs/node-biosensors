export interface LslProducer {
    connectBle(): Promise<void>
    startLslStreams(): Promise<void>
    stopLslStreams(): Promise<void>
    disconnectBle(): Promise<void>
}

export interface LslProducerOptions {
    bleUuid?: string
    connectBleOnCreate?: boolean
    rssiIntervalMs?: number
}
