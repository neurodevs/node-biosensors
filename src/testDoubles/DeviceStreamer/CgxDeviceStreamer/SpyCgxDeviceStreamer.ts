import CgxDeviceStreamer, {
    CgxDeviceStreamerConstructorOptions,
} from '../../../impl/devices/CgxDeviceStreamer.js'

export default class SpyCgxDeviceStreamer extends CgxDeviceStreamer {
    public constructor(options: CgxDeviceStreamerConstructorOptions) {
        super(options)
    }

    public getNumPacketsDropped() {
        return this.numPacketsDropped
    }
}
