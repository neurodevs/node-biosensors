import MuseStreamProducer, {
    MuseProducerConstructorOptions,
} from '../../components/MuseSGen2/MuseStreamProducer'

export default class SpyMuseStreamProducer extends MuseStreamProducer {
    public constructor(options: MuseProducerConstructorOptions) {
        super(options)
    }

    public getHandleEegChannelForChunk() {
        return this.handleEegChannelChunk
    }

    public getHandlePpgChannelForChunk() {
        return this.handlePpgChannelChunk
    }
}
