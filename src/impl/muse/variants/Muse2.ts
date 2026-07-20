import MuseBleVariant from '../MuseBleVariant.js'

export default class Muse2 extends MuseBleVariant {
    protected static readonly charUuids = this.charUuids4ChEeg
    protected static readonly eegCharNames = this.eegCharNames4Ch

    public readonly startCommands = ['h', 'p51', 's', 'd']
}
