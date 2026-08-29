import {
    LslStreamOutlet,
    UsbDevice,
    UsbDeviceController,
} from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceController,
    DeviceControllerOptions,
    LogLevel,
    Resolve,
} from '../types.js'
import AbstractDeviceControllerUsb from '../abstract/AbstractDeviceControllerUsb.js'

export default class CytonDeviceController
    extends AbstractDeviceControllerUsb
    implements CytonController
{
    public static Class?: CytonControllerConstructor
    public static wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

    protected readonly onData: OnUsbData

    private readonly waitAfterConnectMs: number
    private readonly serialNumber?: string
    private readonly exgType: string

    protected constructor(options: CytonControllerConstructorOptions) {
        const {
            usb,
            waitAfterConnectMs,
            onData,
            exgType,
            serialNumber,
            recorder,
            logLevel,
        } = options

        super({ usb, recorder, logLevel })

        this.serialNumber = serialNumber
        this.waitAfterConnectMs = waitAfterConnectMs
        this.onData = onData
        this.exgType = exgType
    }

    public static async Create(options?: CytonControllerOptions) {
        const {
            serialNumber,
            xdfRecordPath,
            waitAfterConnectMs = 2000,
            logDeviceInfo = false,
            exgType = 'ExG',
            logLevel,
        } = options ?? {}

        const disabled = this.resolveDisabledStreams(options ?? {})

        if (!disabled.has('ExG')) {
            await this.ExgOutlet(serialNumber, exgType)
        }

        if (!disabled.has('Accelerometer')) {
            await this.AccelOutlet(serialNumber)
        }

        const onData = this.createOnData(logDeviceInfo, logLevel)
        const usb = this.UsbDeviceController(serialNumber, onData)

        const recorder = await this.XdfStreamRecorder(
            xdfRecordPath,
            this.generateStreamQueries(exgType)
        )

        return new (this.Class ?? this)({
            usb,
            waitAfterConnectMs,
            onData,
            serialNumber,
            recorder,
            logLevel,
            exgType,
        })
    }

    public get streamQueries() {
        return CytonDeviceController.generateStreamQueries(this.exgType)
    }

    private static generateStreamQueries(exgType: string) {
        return [`type="${exgType}"`, 'type="ACCEL"']
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

    private static createOnData(
        logDeviceInfo: boolean,
        logLevel?: LogLevel
    ): OnUsbData {
        let deviceInfoBuffer = Buffer.alloc(0)
        let hasReceivedDeviceInfo = false

        return (data, length, timestampSec) => {
            if (hasReceivedDeviceInfo) {
                this.defaultOnData(data, length, timestampSec, logLevel)
                return
            }

            deviceInfoBuffer = Buffer.concat([deviceInfoBuffer, data])

            if (deviceInfoBuffer.includes('$$$')) {
                hasReceivedDeviceInfo = true

                if (logDeviceInfo) {
                    const text = deviceInfoBuffer
                        .toString('utf8')
                        .replace(/[^\x20-\x7E\n]/g, '')

                    this.log.info(`\n${text}\n`)
                }

                deviceInfoBuffer = Buffer.alloc(0)
            }
        }
    }

    private static defaultOnData(
        data: Buffer,
        length: number,
        timestampSec: number,
        logLevel?: LogLevel
    ) {
        if (logLevel !== 'info') {
            return
        }

        this.log.info(timestampSec, data, length)
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

    private static async ExgOutlet(
        serialNumber: string | undefined,
        exgType: string
    ) {
        await LslStreamOutlet.Create({
            name: `Cyton ${exgType} (${serialNumber})`,
            type: exgType,
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

export type CytonControllerOptions = Resolve<
    DeviceControllerOptions<CytonStream> & {
        serialNumber?: string
        exgType?: string
        waitAfterConnectMs?: number
        logDeviceInfo?: boolean
    }
>

export interface CytonControllerConstructorOptions {
    usb: UsbDevice
    waitAfterConnectMs: number
    onData: OnUsbData
    exgType: string
    serialNumber?: string
    recorder?: XdfRecorder
    logLevel?: LogLevel
}

export type OnUsbData = (
    data: Buffer,
    length: number,
    timestampSec: number
) => void

export type CytonStream = 'ExG' | 'Accelerometer'
