import { XdfRecorder } from '@neurodevs/node-xdf'

import GoveeDeviceController from '../../impl/govee/GoveeDeviceController.js'

export default class SpyGoveeController extends GoveeDeviceController {
    public constructor(deviceUuid: string, recorder?: XdfRecorder) {
        super(deviceUuid, recorder)
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
