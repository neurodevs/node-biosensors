import CgxStreamProducer from '../../components/Cgx/CgxStreamProducer'

export default class SpyCgxProducer extends CgxStreamProducer {
    public constructor() {
        super()
    }

    public getNumPacketsMissingHeader() {
        return this.numPacketsMissingHeader
    }

    public getNumPacketsMalformedHeader() {
        return this.numPacketsMalformedHeader
    }

    public getNumPacketsIncomplete() {
        return this.numPacketsIncomplete
    }

    public getNumPacketsOverflow() {
        return this.numPacketsOverflow
    }
}
