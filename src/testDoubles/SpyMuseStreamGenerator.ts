import MuseStreamGenerator, {
    StreamGeneratorConstructorOptions,
} from '../components/MuseSGen2/MuseStreamGenerator'

export default class SpyMuseStreamGenerator extends MuseStreamGenerator {
    public constructor(options: StreamGeneratorConstructorOptions) {
        super(options)
    }

    public getHandleEegChannelData() {
        return this.handleEegChannelForChunk
    }
}
