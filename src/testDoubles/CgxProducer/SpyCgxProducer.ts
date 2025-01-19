import CgxStreamProducer from '../../components/Cgx/CgxStreamProducer'

export default class SpyCgxProducer extends CgxStreamProducer {
    public constructor() {
        super()
    }

    public getNumPacketsMissingHeader() {
        return this.numPacketsMissingHeader
    }
}
