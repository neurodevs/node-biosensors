import { LslOutlet } from '@neurodevs/node-lsl'
import CgxStreamProducer from '../../modules/Cgx/CgxStreamProducer'

export default class SpyCgxProducer extends CgxStreamProducer {
    public constructor(outlet: LslOutlet) {
        super(outlet)
    }

    public getNumPacketsDropped() {
        return this.numPacketsDropped
    }
}
