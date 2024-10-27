import { BleAdapter } from '@neurodevs/node-ble-adapter'
import { BleScanner, BleScannerImpl } from '@neurodevs/node-ble-scanner'
import { ChannelFormat, LslOutlet, LslOutletImpl } from '@neurodevs/node-lsl'

export default class CgxQuick20Adapter implements BiosensorAdapter {
    public static Class?: BiosensorAdapterConstructor

    protected ble: BleAdapter
    protected outlet: LslOutlet

    protected constructor(ble: BleAdapter, outlet: LslOutlet) {
        this.ble = ble
        this.outlet = outlet
    }

    public static async CreateFromBle(ble: BleAdapter) {
        const outlet = await this.LslOutlet()
        return new (this.Class ?? this)(ble, outlet)
    }

    public static async CreateFromUuid(uuid: string) {
        const scanner = this.BleScanner()
        const ble = await scanner.scanForUuid(uuid)
        return this.CreateFromBle(ble)
    }

    public static async Create() {
        const scanner = this.BleScanner()
        const ble = await scanner.scanForName(this.adapterName)
        return this.CreateFromBle(ble)
    }

    private static readonly adapterName = 'CGX Quick-Series Headset'

    private static readonly channelNames: string[] = ['tmp']

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

    private static BleScanner() {
        return BleScannerImpl.Create() as BleScanner
    }

    private static async LslOutlet() {
        return await LslOutletImpl.Create(this.eegConstructorOptions)
    }
}

export interface BiosensorAdapter {}

export type BiosensorAdapterConstructor = new () => BiosensorAdapter
