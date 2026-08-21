import MuseModelDetector, {
    MuseDetectorConstructorOptions,
} from '../../impl/muse/MuseModelDetector.js'

export default class SpyMuseDetector extends MuseModelDetector {
    public constructor(options: MuseDetectorConstructorOptions) {
        super(options)
    }

    public setReadControlResponse(
        fakeReadControlResponse: () => Promise<string>
    ) {
        this.readControlResponse = fakeReadControlResponse
    }

    public async callReadControlResponse() {
        return await this.readControlResponse()
    }

    public getBle() {
        return this.ble
    }

    public getControlBuffer() {
        return this.controlBuffer
    }
}
