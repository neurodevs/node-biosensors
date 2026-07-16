import CytonDeviceController, {
    CytonControllerConstructorOptions,
} from '../../impl/openbci/CytonDeviceController.js'

export default class SpyCytonController extends CytonDeviceController {
    public constructor(options: CytonControllerConstructorOptions) {
        super(options)
    }

    public getIsConnected() {
        return this.isConnected
    }

    public getIsStreaming() {
        return this.isStreaming
    }

    public getOnData() {
        return this.onData
    }
}
