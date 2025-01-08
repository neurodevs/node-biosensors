import { generateId } from '@sprucelabs/test-utils'
import { LslProducer } from 'types'
import { MuseLslProducerConstructorOptions } from '../../components/MuseStreamProducer'

export default class FakeMuseProducer implements LslProducer {
    public static callsToConstructor: CallToConstructor[] = []
    public static numCallsToConnectBle = 0
    public static numCallsToStartLslStreams = 0
    public static numCallsToStopLslStreams = 0
    public static numCallsToDisconnect = 0

    public readonly bleUuid: string
    public readonly bleName = 'fake-MuseS'

    public constructor(options?: MuseLslProducerConstructorOptions) {
        const { bleUuid } = options ?? {}
        this.bleUuid = bleUuid ?? `fake-${generateId()}`

        FakeMuseProducer.callsToConstructor.push(options)
    }

    public async connectBle() {
        FakeMuseProducer.numCallsToConnectBle++
    }

    public async startLslStreams() {
        FakeMuseProducer.numCallsToStartLslStreams++
    }

    public async stopLslStreams() {
        FakeMuseProducer.numCallsToStopLslStreams++
    }

    public async disconnect() {
        FakeMuseProducer.numCallsToDisconnect++
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToConnectBle = 0
        this.numCallsToStartLslStreams = 0
        this.numCallsToStopLslStreams = 0
        this.numCallsToDisconnect = 0
    }
}

export type CallToConstructor = MuseLslProducerConstructorOptions | undefined
