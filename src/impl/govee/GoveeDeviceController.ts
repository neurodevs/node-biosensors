import {
    BleAdvertisement,
    BleObserver,
    BleObserverController,
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

    private readonly goveeCompanyId = 60552

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
            onAdvertisement: (advertisement: BleAdvertisement) => {
                this.handleAdvertisement(advertisement)
            },
        })
    }

    protected handleAdvertisement(advertisement: BleAdvertisement) {
        if (!this.isStreaming) {
            return
        }

        const { companyId, manufacturerData, timestampSec } = advertisement

        if (companyId !== this.goveeCompanyId) {
            return
        }

        const { temperature, humidity, battery } = this.decode(manufacturerData)

        this.log.info(
            `[${timestampSec}] temperature: ${temperature}°C, humidity: ${humidity}%, battery: ${battery}%`
        )
    }

    private decode(manufacturerData: string) {
        const bytes = Buffer.from(manufacturerData, 'hex')

        return {
            temperature: bytes.readInt16LE(3) / 100,
            humidity: bytes.readUInt16LE(5) / 100,
            battery: bytes.readUInt8(7),
        }
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
