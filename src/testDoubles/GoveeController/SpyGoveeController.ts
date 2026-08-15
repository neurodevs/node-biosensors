import { XdfRecorder } from '@neurodevs/node-xdf'

import GoveeDeviceController, {
    temperatureUnits,
} from '../../impl/govee/GoveeDeviceController.js'

export default class SpyGoveeController extends GoveeDeviceController {
    public constructor(
        deviceUuid: string,
        recorder?: XdfRecorder,
        temperatureUnits?: temperatureUnits
    ) {
        super(deviceUuid, recorder, temperatureUnits)
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
