import { BleScannerImpl, SimplePeripheral } from '@neurodevs/node-ble-scanner'
import { ChannelFormat, LslOutletImpl } from '@neurodevs/node-lsl'

export default class CgxQuick20Adapter implements BiosensorAdapter {
    public static Class?: BiosensorAdapterConstructor

    protected constructor() {}

    public static async Create(peripheral?: SimplePeripheral) {
        if (!peripheral) {
            BleScannerImpl.Create()
        }

        await this.LslOutlet()

        return new (this.Class ?? this)()
    }

    private static readonly channelNames: string[] = []

    private static readonly eegConstructorOptions = {
        name: 'CGX Quick20 EEG Stream',
        type: 'EEG',
        channelNames: this.channelNames,
        sampleRate: 256,
        channelFormat: 'float32' as ChannelFormat,
        sourceId: 'cgx-quick20-eeg',
        manufacturer: 'CGX Systems Cognionics',
        unit: 'microvolt',
        chunkSize: 20,
        maxBuffered: 360,
    }

    private static async LslOutlet() {
        await LslOutletImpl.Create(this.eegConstructorOptions)
    }
}

export interface BiosensorAdapter {}

export type BiosensorAdapterConstructor = new () => BiosensorAdapter
