import MuseStreamProducer, {
    MuseLslProducerConstructorOptions,
} from '../../components/MuseSGen2/MuseStreamProducer'

export default class SpyMuseProducer extends MuseStreamProducer {
    public constructor(options: MuseLslProducerConstructorOptions) {
        super(options)
    }

    public get bleAdapter() {
        return this.ble
    }

    public getHandleEegChannelForChunk() {
        return this.handleEegChannelChunk
    }

    public getHandlePpgChannelForChunk() {
        return this.handlePpgChannelChunk
    }
}
