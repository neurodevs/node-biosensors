import CgxStreamProducer from '../../components/Cgx/CgxStreamProducer'

export default class SpyCgxProducer extends CgxStreamProducer {
    public constructor() {
        super()
    }

    public getNumPacketsDropped() {
        return this.numPacketsDropped
    }
}
