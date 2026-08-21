import MuseDeviceController, {
    MuseControllerConstructorOptions,
} from '../../impl/muse/MuseDeviceController.js'

export default class SpyMuseController extends MuseDeviceController {
    public constructor(options: MuseControllerConstructorOptions) {
        super(options)
    }

    public getDeviceId() {
        return this.deviceId
    }

    public getVariant() {
        return this.variant
    }

    public getName() {
        return this.ble.name
    }

    public getBle() {
        return this.ble
    }

    public getState() {
        return this.state
    }
}
