import { BleObserver, BleObserverController } from '@neurodevs/node-lsl'
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

    protected constructor(deviceUuid: string, recorder?: XdfRecorder) {
        super(recorder)

        this.deviceUuid = deviceUuid
        this.observer = this.BleObserverController()
    }

    public static async Create(options: GoveeControllerOptions) {
        const { deviceUuid, xdfRecordPath } = options

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath)
            : undefined

        return new (this.Class ?? this)(deviceUuid, recorder)
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

    private BleObserverController() {
        return BleObserverController.Create({
            deviceUuid: this.deviceUuid,
            onAdvertisement: (
                data: Buffer,
                length: number,
                timestampSec: number
            ) => {
                this.handleAdvertisement(data, length, timestampSec)
            },
        })
    }

    protected handleAdvertisement(
        data: Buffer,
        length: number,
        timestampSec: number
    ) {
        if (!this.isStreaming) {
            return
        }

        this.log.info(`[${timestampSec}] ${data.toString('hex')} ${length}`)
    }

    private get log() {
        return GoveeDeviceController.log
    }

    public static async XdfStreamRecorder(xdfRecordPath: string) {
        return await XdfStreamRecorder.Create(xdfRecordPath, [])
    }
}

export type GoveeControllerConstructor = new (
    deviceUuid: string,
    recorder?: XdfRecorder
) => DeviceControllerBle

export interface GoveeControllerOptions extends DeviceControllerOptions {
    deviceUuid: string
}
