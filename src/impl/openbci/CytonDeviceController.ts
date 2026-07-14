import { XdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceController,
    DeviceControllerOptions,
} from '../BiosensorDeviceFactory.js'
import AbstractDeviceController from '../abstract/AbstractDeviceController.js'
import {
    LslStreamOutlet,
    UsbController,
    UsbDeviceController,
} from '@neurodevs/node-lsl'

export default class CytonDeviceController
    extends AbstractDeviceController
    implements CytonController
{
    public static Class?: CytonControllerConstructor
    public static readonly streamQueries: string[] = []

    private readonly usb: UsbController
    private readonly serialNumber?: string

    protected constructor(
        usb: UsbController,
        serialNumber?: string,
        recorder?: XdfRecorder
    ) {
        super(recorder)

        this.usb = usb
        this.serialNumber = serialNumber
    }

    public static async Create(options?: CytonControllerOptions) {
        const { serialNumber, xdfRecordPath } = options ?? {}

        await this.ExgOutlet(serialNumber)

        const usb = this.UsbDeviceController(serialNumber)

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath, this.streamQueries)
            : undefined

        return new (this.Class ?? this)(usb, serialNumber, recorder)
    }

    public get streamQueries() {
        return CytonDeviceController.streamQueries
    }

    protected get deviceId() {
        return this.serialNumber ?? ''
    }

    protected async handleConnect() {
        this.usb.connect()
    }

    protected async handleStartStreaming() {
        this.usb.writeUsb('b')
    }

    protected async handleStopStreaming() {
        this.usb.writeUsb('s')
    }

    protected async handleDisconnect() {
        this.usb.disconnect()
    }

    protected static onData = (
        _data: Buffer,
        _length: number,
        _timestampSec: number
    ) => {}

    private static UsbDeviceController(serialNumber: string | undefined) {
        return UsbDeviceController.Create({
            onData: this.onData,
            serialNumber,
        })
    }

    private static async ExgOutlet(serialNumber?: string) {
        await LslStreamOutlet.Create({
            name: `Cyton ExG (${serialNumber})`,
            type: 'ExG',
            channelNames: [
                'CH1',
                'CH2',
                'CH3',
                'CH4',
                'CH5',
                'CH6',
                'CH7',
                'CH8',
            ],
            sampleRateHz: 250,
            channelFormat: 'float32',
            sourceId: `cyton-exg-${serialNumber}`,
            manufacturer: 'OpenBCI',
            units: 'microvolt',
            chunkSize: 1,
        })
    }
}

export interface CytonController extends DeviceController {}

export type CytonControllerConstructor = new (
    usb: UsbController,
    serialNumber?: string,
    recorder?: XdfRecorder
) => CytonController

export interface CytonControllerOptions extends DeviceControllerOptions {
    serialNumber?: string
}
