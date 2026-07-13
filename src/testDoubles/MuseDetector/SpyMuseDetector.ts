import { BleController } from '@neurodevs/node-lsl'
import MuseModelDetector, {
    ControlBuffer,
} from '../../impl/muse/MuseModelDetector.js'

export default class SpyMuseDetector extends MuseModelDetector {
    public constructor(ble: BleController, controlBuffer: ControlBuffer) {
        super(ble, controlBuffer)
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
