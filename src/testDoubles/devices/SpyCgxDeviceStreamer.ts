import { LslOutlet } from '@neurodevs/node-lsl'
import CgxDeviceStreamer from '../../devices/CgxDeviceStreamer'

export default class SpyCgxDeviceStreamer extends CgxDeviceStreamer {
    public constructor(eegOutlet: LslOutlet, accelOutlet: LslOutlet) {
        super(eegOutlet, accelOutlet)
    }

    public getNumPacketsDropped() {
        return this.numPacketsDropped
    }
}
