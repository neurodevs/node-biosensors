import MuseBleVariant from '../MuseBleVariant.js'

export default class MuseSGen1 extends MuseBleVariant {
    protected static readonly model = 'Muse S Gen 1'
    protected static readonly charUuids = this.charUuids5ChEeg
    protected static readonly eegCharNames = this.eegCharNames5Ch

    public readonly startCommands = ['h', 'p50', 's', 'd']
}
