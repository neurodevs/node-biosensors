import MuseStreamProducer, {
    MuseLslProducerConstructorOptions,
} from '../../components/MuseSGen2/MuseStreamProducer'

export default class SpyMuseStreamProducer extends MuseStreamProducer {
    public constructor(options: MuseLslProducerConstructorOptions) {
        super(options)
    }

    public getHandleEegChannelForChunk() {
        return this.handleEegChannelChunk
    }

    public getHandlePpgChannelForChunk() {
        return this.handlePpgChannelChunk
    }
}
