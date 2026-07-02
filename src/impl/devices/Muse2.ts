import MuseSGen2, { MUSE_CHAR_UUIDS } from './MuseSGen2.js'

export const MUSE_2_CHAR_UUIDS: Record<string, string> = Object.fromEntries(
    Object.entries(MUSE_CHAR_UUIDS).filter(([name]) => name !== 'EEG_AUX')
)

export default class Muse2 extends MuseSGen2 {
    protected static readonly charUuids = MUSE_2_CHAR_UUIDS

    protected static readonly eegCharNames = [
        'EEG_TP10',
        'EEG_AF8',
        'EEG_TP9',
        'EEG_AF7',
    ]

    // p51 = 4-channel EEG + PPG + accel + gyro
    public static readonly startCommands = ['h', 'p51', 's', 'd']

    public readonly startCommands = Muse2.startCommands
}
