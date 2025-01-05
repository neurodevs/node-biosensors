import { BleAdapter, BleDeviceScanner, BleScanner } from '@neurodevs/node-ble'
import { ChannelFormat, LslOutlet, LslStreamOutlet } from '@neurodevs/node-lsl'

export default class CgxQuick20Adapter implements BiosensorAdapter {
    public static Class?: BiosensorAdapterConstructor

    protected ble: BleAdapter
    protected outlet: LslOutlet

    protected constructor(ble: BleAdapter, outlet: LslOutlet) {
        this.ble = ble
        this.outlet = outlet
    }

    public static async Create() {
        const scanner = this.BleDeviceScanner()
        const ble = await scanner.scanForName(
            this.adapterName,
            this.defaultScanOptions
        )
        return this.CreateFromBle(ble)
    }

    public static async CreateFromBle(ble: BleAdapter) {
        const outlet = await this.LslOutlet()
        return new (this.Class ?? this)(ble, outlet)
    }

    public static async CreateFromUuid(uuid: string) {
        const scanner = this.BleDeviceScanner()
        const ble = await scanner.scanForUuid(uuid, this.defaultScanOptions)
        return this.CreateFromBle(ble)
    }

    private static defaultScanOptions = {
        characteristicCallbacks: {},
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

    private static BleDeviceScanner() {
        return BleDeviceScanner.Create() as BleScanner
    }

    private static async LslOutlet() {
        return await LslStreamOutlet.Create(this.eegConstructorOptions)
    }
}

export interface BiosensorAdapter {}

export type BiosensorAdapterConstructor = new () => BiosensorAdapter
