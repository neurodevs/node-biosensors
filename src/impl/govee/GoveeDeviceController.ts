import {
    BleObserver,
    BleObserverController,
    BleObserverOptions,
} from '@neurodevs/node-lsl'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

import {
    DeviceControllerBle,
    DeviceControllerOptions,
} from '../BiosensorDeviceFactory.js'
import AbstractDeviceController from '../abstract/AbstractDeviceController.js'

export default class GoveeDeviceController
    extends AbstractDeviceController
    implements DeviceControllerBle
{
    public static Class?: GoveeControllerConstructor
    public static log = console

    protected readonly observer: BleObserver
    protected readonly deviceUuid: string

    protected constructor(
        observer: BleObserver,
        deviceUuid: string,
        recorder?: XdfRecorder
    ) {
        super(recorder)

        this.observer = observer
        this.deviceUuid = deviceUuid
    }

    public static async Create(options: GoveeControllerOptions) {
        const { deviceUuid, xdfRecordPath } = options

        const observer = this.BleObserverController(options)

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath)
            : undefined

        return new (this.Class ?? this)(observer, deviceUuid, recorder)
    }

    protected async handleConnect() {
        await this.observer.startObserving()
    }

    protected async handleDisconnect() {
        await this.observer.stopObserving()
    }

    protected async handleStartStreaming() {}

    protected async handleStopStreaming() {}

    public get streamQueries() {
        return []
    }

    protected get deviceId() {
        return this.deviceUuid
    }

    public get bleUuid() {
        return this.deviceUuid
    }

    public get bleName() {
        return ''
    }

    private static BleObserverController(options: BleObserverOptions) {
        const { deviceUuid } = options
        return BleObserverController.Create({
            deviceUuid,
            onAdvertisement: (
                data: Buffer,
                length: number,
                timestampSec: number
            ) => {
                this.log.info(
                    `[${timestampSec}] ${data.toString('hex')} ${length}`
                )
            },
        })
    }

    public static async XdfStreamRecorder(xdfRecordPath: string) {
        return await XdfStreamRecorder.Create(xdfRecordPath, [])
    }
}

export type GoveeControllerConstructor = new (
    observer: BleObserver,
    deviceUuid: string,
    recorder?: XdfRecorder
) => DeviceControllerBle

export interface GoveeControllerOptions extends DeviceControllerOptions {
    deviceUuid: string
}
