import {
    BleObserver,
    BleObserverController,
    BleObserverOptions,
} from '@neurodevs/node-lsl'

import {
    DeviceControllerBle,
    DeviceControllerOptions,
} from '../BiosensorDeviceFactory.js'

export default class GoveeDeviceController implements DeviceControllerBle {
    public static Class?: GoveeControllerConstructor
    public static log = console

    protected readonly observer: BleObserver

    protected constructor(observer: BleObserver) {
        this.observer = observer
    }

    public static Create(options: GoveeControllerOptions) {
        const observer = this.BleObserverController(options)
        return new (this.Class ?? this)(observer)
    }

    public async connect() {
        await this.observer.startObserving()
    }

    public async startStreaming() {}

    public async stopStreaming() {}

    public async disconnect() {
        await this.observer.stopObserving()
    }

    public get outlets() {
        return []
    }

    public get streamQueries() {
        return []
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
