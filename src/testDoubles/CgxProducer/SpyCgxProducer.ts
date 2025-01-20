import CgxStreamProducer from '../../components/Cgx/CgxStreamProducer'

export default class SpyCgxProducer extends CgxStreamProducer {
    public constructor() {
        super()
    }

    public getNumPacketsIncomplete() {
        return this.numPacketsIncomplete
    }

    public getNumPacketsOverflow() {
        return this.numPacketsOverflow
    }

    public getNumPacketsDropped() {
        return this.numPacketsDropped
    }
}
