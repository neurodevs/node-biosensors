import MuseStreamProducer, {
    MuseLslProducerConstructorOptions,
} from '../../components/MuseStreamProducer'

export default class SpyMuseProducer extends MuseStreamProducer {
    public constructor(options: MuseLslProducerConstructorOptions) {
        super(options)
    }

    public get bleConnector() {
        return this.connector
    }

    public getHandleEegChannelForChunk() {
        return this.handleEegChannelChunk
    }

    public getHandlePpgChannelForChunk() {
        return this.handlePpgChannelChunk
    }
}
