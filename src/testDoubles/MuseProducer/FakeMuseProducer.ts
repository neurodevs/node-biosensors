import {
    MuseLslProducer,
    MuseLslProducerConstructorOptions,
} from '../../components/MuseSGen2/MuseStreamProducer'

export default class FakeMuseProducer implements MuseLslProducer {
    public static callsToConstructor: CallToConstructor[] = []
    public static numCallsToConnectBle = 0
    public static numCallsToStartLslStreams = 0
    public static numCallsToStopLslStreams = 0

    public constructor(options?: MuseLslProducerConstructorOptions) {
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

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToConnectBle = 0
        this.numCallsToStartLslStreams = 0
        this.numCallsToStopLslStreams = 0
    }
}

export type CallToConstructor = MuseLslProducerConstructorOptions | undefined
