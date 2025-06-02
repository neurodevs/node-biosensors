import MuseDeviceStreamer, {
    MuseDeviceStreamerConstructorOptions,
} from '../modules/MuseDeviceStreamer'

export default class SpyMuseDeviceStreamer extends MuseDeviceStreamer {
    public constructor(options: MuseDeviceStreamerConstructorOptions) {
        super(options)
    }

    public getHandleEegChannelForChunk() {
        return this.handleEegChannelChunk
    }

    public getHandlePpgChannelForChunk() {
        return this.handlePpgChannelChunk
    }

    public getBleConnector() {
        return this.bleConnector
    }
}
