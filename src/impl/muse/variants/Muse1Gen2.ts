import MuseSGen2, { MUSE_CHAR_UUIDS } from './MuseSGen2.js'

export const MUSE_1_GEN_2_CHAR_UUIDS: Record<string, string> =
    Object.fromEntries(
        Object.entries(MUSE_CHAR_UUIDS).filter(([name]) => name !== 'EEG_AUX')
    )

export default class Muse1Gen2 extends MuseSGen2 {
    protected static readonly charUuids = MUSE_1_GEN_2_CHAR_UUIDS

    protected static readonly eegCharNames = [
        'EEG_TP10',
        'EEG_AF8',
        'EEG_TP9',
        'EEG_AF7',
    ]

    public static readonly startCommands = ['h', 'p21', 's', 'd']

    public readonly startCommands = Muse1Gen2.startCommands
}
