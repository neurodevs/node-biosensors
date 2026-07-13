import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

import {
    DeviceController,
    DeviceControllerOptions,
} from '../BiosensorDeviceFactory.js'
import AbstractDeviceController from '../abstract/AbstractDeviceController.js'

export default class CytonDeviceController
    extends AbstractDeviceController
    implements CytonController
{
    public static Class?: CytonControllerConstructor
    public static readonly streamQueries: string[] = []

    private readonly _serialNumber?: string

    protected constructor(serialNumber?: string, recorder?: XdfRecorder) {
        super(recorder)

        this._serialNumber = serialNumber
    }

    public static async Create(options?: CytonControllerOptions) {
        const { serialNumber, xdfRecordPath } = options ?? {}

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath)
            : undefined

        return new (this.Class ?? this)(serialNumber, recorder)
    }

    public get streamQueries() {
        return CytonDeviceController.streamQueries
    }

    protected get deviceId() {
        return this._serialNumber ?? ''
    }

    protected async handleConnect() {}

    protected async handleStartStreaming() {}

    protected async handleStopStreaming() {}

    protected async handleDisconnect() {}

    private static async XdfStreamRecorder(xdfRecordPath: string) {
        return XdfStreamRecorder.Create(xdfRecordPath, this.streamQueries)
    }
}

export interface CytonController extends DeviceController {}

export type CytonControllerConstructor = new (
    serialNumber?: string,
    recorder?: XdfRecorder
) => CytonController

export interface CytonControllerOptions extends DeviceControllerOptions {
    serialNumber?: string
}
