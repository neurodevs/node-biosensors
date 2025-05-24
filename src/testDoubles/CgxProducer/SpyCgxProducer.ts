import { LslOutlet } from '@neurodevs/node-lsl'
import CgxStreamProducer from '../../modules/Cgx/CgxStreamProducer'

export default class SpyCgxProducer extends CgxStreamProducer {
    public constructor(eegOutlet: LslOutlet, accelOutlet: LslOutlet) {
        super(eegOutlet, accelOutlet)
    }

    public getNumPacketsDropped() {
        return this.numPacketsDropped
    }
}
