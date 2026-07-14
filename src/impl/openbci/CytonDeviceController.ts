import { XdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceController,
    DeviceControllerOptions,
} from '../BiosensorDeviceFactory.js'
import AbstractDeviceController from '../abstract/AbstractDeviceController.js'
import { UsbController, UsbDeviceController } from '@neurodevs/node-lsl'

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

        const usb = UsbDeviceController.Create({
            serialNumber,
        })

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

    protected async handleDisconnect() {}
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
