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
    public static wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

    private readonly usb: UsbController
    private readonly serialNumber?: string
    private readonly waitAfterConnectMs: number

    protected constructor(
        usb: UsbController,
        waitAfterConnectMs: number,
        serialNumber?: string,
        recorder?: XdfRecorder
    ) {
        super(recorder)

        this.usb = usb
        this.serialNumber = serialNumber
        this.waitAfterConnectMs = waitAfterConnectMs
    }

    public static async Create(options?: CytonControllerOptions) {
        const {
            serialNumber,
            xdfRecordPath,
            waitAfterConnectMs = 2000,
        } = options ?? {}

        await this.ExgOutlet(serialNumber)
        await this.AccelOutlet(serialNumber)

        const usb = this.UsbDeviceController(serialNumber)

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath, this.streamQueries)
            : undefined

        return new (this.Class ?? this)(
            usb,
            waitAfterConnectMs,
            serialNumber,
            recorder
        )
    }

    public get streamQueries() {
        return CytonDeviceController.streamQueries
    }

    protected get deviceId() {
        return this.serialNumber ?? ''
    }

    protected async handleConnect() {
        this.usb.connect()
        await CytonDeviceController.wait(this.waitAfterConnectMs)
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

    protected static onData: OnUsbData = (data, length, timestampSec) => {
        console.info(timestampSec, data, length)
    }

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

    private static async AccelOutlet(serialNumber?: string) {
        await LslStreamOutlet.Create({
            name: `Cyton Accelerometer (${serialNumber})`,
            type: 'ACCEL',
            channelNames: ['X', 'Y', 'Z'],
            sampleRateHz: 25,
            channelFormat: 'float32',
            sourceId: `cyton-accelerometer-${serialNumber}`,
            manufacturer: 'OpenBCI',
            units: 'g',
            chunkSize: 1,
        })
    }
}

export interface CytonController extends DeviceController {}

export type CytonControllerConstructor = new (
    usb: UsbController,
    waitAfterConnectMs: number,
    serialNumber?: string,
    recorder?: XdfRecorder
) => CytonController

export interface CytonControllerOptions extends DeviceControllerOptions {
    serialNumber?: string
    waitAfterConnectMs?: number
}

export type OnUsbData = (
    data: Buffer,
    length: number,
    timestampSec: number
) => void
