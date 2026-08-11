import {
    BleObserver,
    BleObserverController,
    BleObserverOptions,
} from '@neurodevs/node-lsl'

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

    protected constructor(observer: BleObserver) {
        super()

        this.observer = observer
    }

    public static Create(options: GoveeControllerOptions) {
        const observer = this.BleObserverController(options)
        return new (this.Class ?? this)(observer)
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
        return ''
    }

    public get bleUuid() {
        return ''
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
}

export type GoveeControllerConstructor = new (
    observer: BleObserver
) => DeviceControllerBle

export interface GoveeControllerOptions extends DeviceControllerOptions {
    deviceUuid: string
}
