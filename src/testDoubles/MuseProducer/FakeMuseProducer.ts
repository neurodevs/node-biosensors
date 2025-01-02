import { MuseProducer } from '../../components/MuseSGen2/MuseStreamProducer'

export default class FakeMuseProducer implements MuseProducer {
    public static numCallsToConstructor = 0
    public static numCallsToConnectBle = 0
    public static numCallsToStartLslStreams = 0

    public constructor() {
        FakeMuseProducer.numCallsToConstructor++
    }
    public async connectBle() {
        FakeMuseProducer.numCallsToConnectBle++
    }
    public async startLslStreams() {
        FakeMuseProducer.numCallsToStartLslStreams++
    }

    public static resetTestDouble() {
        this.numCallsToConstructor = 0
        this.numCallsToConnectBle = 0
        this.numCallsToStartLslStreams = 0
    }
}
