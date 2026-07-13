import { XdfRecorder } from '@neurodevs/node-xdf'
import CytonDeviceController from '../../impl/openbci/CytonDeviceController.js'

export default class SpyCytonController extends CytonDeviceController {
    public constructor(serialNumber?: string, recorder?: XdfRecorder) {
        super(serialNumber, recorder)
    }

    public getIsConnected() {
        return this.isConnected
    }

    public getIsStreaming() {
        return this.isStreaming
    }
}
