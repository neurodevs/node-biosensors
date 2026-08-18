import { WriteStream } from 'node:fs'

import {
    BleGatt,
    BleGattController,
    CharacteristicCallbacks,
} from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceControllerBle,
    DeviceControllerBleOptions,
} from '../BiosensorDeviceFactory.js'
import { LogLevel } from '../BiosensorDeviceFactory.js'
import AbstractDeviceControllerBle from '../abstract/AbstractDeviceControllerBle.js'
import MuseSAthena from './variants/MuseSAthena.js'
import MuseSGen2 from './variants/MuseSGen2.js'
import MuseSGen1 from './variants/MuseSGen1.js'
import Muse2 from './variants/Muse2.js'
import Muse1Gen2 from './variants/Muse1Gen2.js'
import { detectMuseModel } from './MuseModelDetector.js'

export const CONTROL_UUID = '273E0001-4C4D-454D-96BE-F03BAC821358'

export const MUSE_CODENAME_MODELS: {
    pattern: string
    model: MuseDeviceModel
}[] = [
    { pattern: 'Athena', model: 'Muse S Athena' },
    { pattern: 'Letto', model: 'Muse S Gen 2' },
    { pattern: 'Newton', model: 'Muse S Gen 1' },
    { pattern: 'Blackcomb', model: 'Muse 2' },
    { pattern: 'MU-02', model: 'Muse 1 Gen 2' },
]

export const MUSE_VARIANTS = {
    'Muse S Athena': MuseSAthena,
    'Muse S Gen 2': MuseSGen2,
    'Muse S Gen 1': MuseSGen1,
    'Muse 2': Muse2,
    'Muse 1 Gen 2': Muse1Gen2,
}

export default class MuseDeviceController
    extends AbstractDeviceControllerBle
    implements DeviceControllerBle
{
    public static Class?: MuseDeviceControllerConstructor
    public static fallbackDeviceCounter = 1

    protected readonly variant: MuseVariant
    protected preConnected = false

    protected constructor(
        variant: MuseVariant,
        ble: BleGatt,
        recorder?: XdfRecorder,
        txtStream?: WriteStream,
        logLevel?: LogLevel
    ) {
        super(ble, recorder, txtStream, logLevel)

        this.variant = variant
    }

    public static async Create(options?: MuseControllerOptions) {
        const { xdfRecordPath, txtRecordPath, logLevel, model, bleUuid } =
            options ?? {}

        const txtStream = this.TxtRecordStream(txtRecordPath)

        const deviceModel = model ?? (await detectMuseModel(bleUuid))

        const variant = await this.createVariant(deviceModel, {
            ...options,
            txtStream,
        })

        const ble = this.BleGattController(variant.charCallbacks, options)

        const recorder = await this.XdfStreamRecorder(
            xdfRecordPath,
            variant.streamQueries
        )

        return new (this.Class ?? this)(
            variant,
            ble,
            recorder,
            txtStream,
            logLevel
        )
    }

    protected async handleConnect() {
        if (this.preConnected) {
            return
        }

        await super.handleConnect()
    }

    protected async handleStartStreaming() {
        for (const cmd of this.variant.startCommands) {
            await this.ble.writeCharacteristic(CONTROL_UUID, cmd)

            await new Promise((resolve) => {
                setTimeout(resolve, 100)
            })
        }
    }

    protected async handleStopStreaming() {
        await this.ble.writeCharacteristic(CONTROL_UUID, 'h')
    }

    protected get deviceId() {
        return this.bleUuid
    }

    public get streamQueries() {
        return this.variant.streamQueries
    }

    private static async createVariant(
        model: MuseDeviceModel,
        options?: MuseVariantOptions
    ) {
        const MuseVariant = MUSE_VARIANTS[model]
        return await MuseVariant.Create({ ...(options ?? {}), model })
    }

    private static BleGattController(
        charCallbacks: CharacteristicCallbacks,
        options?: MuseControllerOptions
    ) {
        const { bleUuid, rssiIntervalMs } = options ?? {}

        return BleGattController.Create({
            charCallbacks,
            rssiIntervalMs,
            ...(bleUuid
                ? { deviceUuid: bleUuid }
                : { deviceNamePrefix: 'Muse' }),
        })
    }
}

export type MuseDeviceControllerConstructor = new (
    variant: MuseVariant,
    ble: BleGatt,
    recorder?: XdfRecorder
) => DeviceControllerBle

export interface MuseControllerOptions extends DeviceControllerBleOptions {
    model?: MuseDeviceModel
    disableEeg?: boolean
    disablePpg?: boolean
    disableGyro?: boolean
    disableAccel?: boolean
}

export interface MuseVariantOptions extends MuseControllerOptions {
    txtStream?: WriteStream
}

export interface MuseVariant {
    readonly charCallbacks: CharacteristicCallbacks
    readonly streamQueries: string[]
    readonly startCommands: string[]
}

export type MuseDeviceModel =
    | 'Muse S Athena'
    | 'Muse S Gen 2'
    | 'Muse S Gen 1'
    | 'Muse 2'
    | 'Muse 1 Gen 2'
