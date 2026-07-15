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
    public static startTimeoutMs = 5000
    public static retryIntervalMs = 500

    protected readonly onData: OnUsbData

    private readonly usb: UsbController
    private readonly serialNumber?: string
    private readonly getHasReceivedData: () => boolean

    protected constructor(
        usb: UsbController,
        onDataHandler: OnUsbData,
        getHasReceivedData: () => boolean,
        serialNumber?: string,
        recorder?: XdfRecorder
    ) {
        super(recorder)

        this.usb = usb
        this.serialNumber = serialNumber
        this.onData = onDataHandler
        this.getHasReceivedData = getHasReceivedData
    }

    public static async Create(options?: CytonControllerOptions) {
        const { serialNumber, xdfRecordPath } = options ?? {}

        await this.ExgOutlet(serialNumber)
        await this.AccelOutlet(serialNumber)

        let hasReceivedData = false

        const onData: OnUsbData = (data, length, timestampSec) => {
            hasReceivedData = true
            console.info(timestampSec, data, length)
        }

        const usb = this.UsbDeviceController(serialNumber, onData)

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath, this.streamQueries)
            : undefined

        return new (this.Class ?? this)(
            usb,
            onData,
            () => hasReceivedData,
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
    }

    protected async handleStartStreaming() {
        for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
            if (this.getHasReceivedData()) {
                break
            }

            this.usb.writeUsb('b')

            await new Promise((r) =>
                setTimeout(r, CytonDeviceController.retryIntervalMs)
            )
        }
    }

    private get maxAttempts() {
        return Math.ceil(
            CytonDeviceController.startTimeoutMs /
                CytonDeviceController.retryIntervalMs
        )
    }

    protected async handleStopStreaming() {
        this.usb.writeUsb('s')
    }

    protected async handleDisconnect() {
        this.usb.disconnect()
    }

    private static UsbDeviceController(
        serialNumber: string | undefined,
        onData: OnUsbData
    ) {
        return UsbDeviceController.Create({
            onData,
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
    onDataHandler: OnUsbData,
    getHasReceivedData: () => boolean,
    serialNumber?: string,
    recorder?: XdfRecorder
) => CytonController

export interface CytonControllerOptions extends DeviceControllerOptions {
    serialNumber?: string
}

export type OnUsbData = (
    data: Buffer,
    length: number,
    timestampSec: number
) => void
