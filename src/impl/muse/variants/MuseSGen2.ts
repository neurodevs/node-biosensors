import MuseBleVariant from '../MuseBleVariant.js'

export default class MuseSGen2 extends MuseBleVariant {
    protected static readonly charUuids = this.charUuids5ChEeg
    protected static readonly eegCharNames = this.eegCharNames5Ch

    public readonly startCommands = ['h', 'p50', 's', 'd']
}
