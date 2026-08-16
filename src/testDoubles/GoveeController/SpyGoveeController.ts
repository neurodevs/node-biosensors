import GoveeDeviceController, {
    GoveeControllerConstructorOptions,
} from '../../impl/govee/GoveeDeviceController.js'

export default class SpyGoveeController extends GoveeDeviceController {
    public constructor(options: GoveeControllerConstructorOptions) {
        super(options)
    }

    public getDeviceId() {
        return this.deviceId
    }

    public getIsConnected() {
        return this.isConnected
    }

    public getIsStreaming() {
        return this.isStreaming
    }
}
