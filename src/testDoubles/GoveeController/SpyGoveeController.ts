import { BleObserver } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import GoveeDeviceController from '../../impl/govee/GoveeDeviceController.js'

export default class SpyGoveeController extends GoveeDeviceController {
    public constructor(
        observer: BleObserver,
        deviceUuid: string,
        recorder?: XdfRecorder
    ) {
        super(observer, deviceUuid, recorder)
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
