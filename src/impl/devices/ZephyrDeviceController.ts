import {
    DeviceControllerBle,
    DeviceControllerBleConstructor,
    DeviceControllerBleOptions,
} from '../BiosensorDeviceFactory.js'
import { BleController, BleDeviceController } from '@neurodevs/node-lsl'
import AbstractDeviceControllerBle from '../AbstractDeviceControllerBle.js'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

export default class ZephyrDeviceController
    extends AbstractDeviceControllerBle
    implements DeviceControllerBle
{
    public static Class?: DeviceControllerBleConstructor
    public static readonly streamQueries: string[] = []

    protected constructor(ble: BleController, recorder?: XdfRecorder) {
        super(ble, recorder)
    }

    public static async Create(options?: DeviceControllerBleOptions) {
        const { xdfRecordPath } = options ?? {}

        const ble = await this.BleDeviceController(options)

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath)
            : undefined

        return new (this.Class ?? this)(ble, recorder)
    }

    public get streamQueries() {
        return ZephyrDeviceController.streamQueries
    }

    protected get deviceId() {
        return ''
    }

    protected async handleStartStreaming() {}

    protected async handleStopStreaming() {}

    private static async BleDeviceController(
        options?: DeviceControllerBleOptions
    ) {
        const { bleUuid } = options ?? {}

        return BleDeviceController.Create({
            deviceUuid: bleUuid,
            deviceNamePrefix: 'BH BHT',
            charCallbacks: [],
        })
    }

    public static async XdfStreamRecorder(xdfRecordPath: string) {
        return XdfStreamRecorder.Create(xdfRecordPath, [])
    }
}
