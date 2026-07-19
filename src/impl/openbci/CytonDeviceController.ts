import { XdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceController,
    DeviceControllerOptions,
} from '../BiosensorDeviceFactory.js'
import AbstractDeviceControllerUsb from '../abstract/AbstractDeviceControllerUsb.js'
import {
    LslStreamOutlet,
    UsbController,
    UsbDeviceController,
} from '@neurodevs/node-lsl'

export default class CytonDeviceController
    extends AbstractDeviceControllerUsb
    implements CytonController
{
    public static Class?: CytonControllerConstructor
    public static readonly streamQueries: string[] = []
    public static wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    public static log = console.info

    protected readonly onData: OnUsbData

    private readonly waitAfterConnectMs: number
    private readonly serialNumber?: string

    protected constructor(options: CytonControllerConstructorOptions) {
        const { usb, waitAfterConnectMs, onData, serialNumber, recorder } =
            options

        super(usb, recorder)

        this.serialNumber = serialNumber
        this.waitAfterConnectMs = waitAfterConnectMs
        this.onData = onData
    }

    public static async Create(options?: CytonControllerOptions) {
        const {
            serialNumber,
            xdfRecordPath,
            waitAfterConnectMs = 2000,
            logDeviceInfo = false,
        } = options ?? {}

        await this.ExgOutlet(serialNumber)
        await this.AccelOutlet(serialNumber)

        const onData = this.createOnData(logDeviceInfo)
        const usb = this.UsbDeviceController(serialNumber, onData)

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath, this.streamQueries)
            : undefined

        return new (this.Class ?? this)({
            usb,
            waitAfterConnectMs,
            onData,
            serialNumber,
            recorder,
        })
    }

    public get streamQueries() {
        return CytonDeviceController.streamQueries
    }

    protected get deviceId() {
        return this.serialNumber ?? ''
    }

    protected async handleConnect() {
        await super.handleConnect()

        await CytonDeviceController.wait(this.waitAfterConnectMs)

        await this.usb.writeUsb('v')
    }

    protected async handleStartStreaming() {
        this.usb.writeUsb('b')
    }

    protected async handleStopStreaming() {
        this.usb.writeUsb('s')
    }

    private static createOnData(logDeviceInfo: boolean): OnUsbData {
        let deviceInfoBuffer = Buffer.alloc(0)
        let hasReceivedDeviceInfo = false

        return (data, length, timestampSec) => {
            if (hasReceivedDeviceInfo) {
                this.defaultOnData(data, length, timestampSec)
                return
            }

            deviceInfoBuffer = Buffer.concat([deviceInfoBuffer, data])

            if (deviceInfoBuffer.includes('$$$')) {
                hasReceivedDeviceInfo = true

                if (logDeviceInfo) {
                    const text = deviceInfoBuffer
                        .toString('utf8')
                        .replace(/[^\x20-\x7E\n]/g, '')

                    this.log(`\n${text}\n`)
                }

                deviceInfoBuffer = Buffer.alloc(0)
            }
        }
    }

    private static defaultOnData: OnUsbData = (data, length, timestampSec) => {
        this.log(timestampSec, data, length)
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
    options: CytonControllerConstructorOptions
) => CytonController

export interface CytonControllerOptions extends DeviceControllerOptions {
    serialNumber?: string
    waitAfterConnectMs?: number
    logDeviceInfo?: boolean
}

export interface CytonControllerConstructorOptions {
    usb: UsbController
    waitAfterConnectMs: number
    onData: OnUsbData
    serialNumber?: string
    recorder?: XdfRecorder
}

export type OnUsbData = (
    data: Buffer,
    length: number,
    timestampSec: number
) => void
