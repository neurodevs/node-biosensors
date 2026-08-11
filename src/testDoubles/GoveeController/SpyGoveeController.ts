import { BleObserver } from '@neurodevs/node-lsl'

import GoveeDeviceController from '../../impl/govee/GoveeDeviceController.js'

export default class SpyGoveeController extends GoveeDeviceController {
    public constructor(observer: BleObserver) {
        super(observer)
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
