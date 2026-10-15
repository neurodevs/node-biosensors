import MuseBleVariant from '../MuseBleVariant.js'

export default class Muse1Gen2 extends MuseBleVariant {
    protected static readonly model = 'Muse 1 Gen 2'
    protected static readonly charUuids = this.charUuids4ChEeg
    protected static readonly eegCharNames = this.eegCharNames4Ch

    public readonly startCommands = ['h', 'p21', 's', 'd']
}
