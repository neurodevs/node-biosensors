import fs from 'node:fs'

import {
    BleController,
    BleDeviceController,
    CharacteristicCallbacks,
} from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceControllerBle,
    DeviceControllerBleOptions,
} from '../BiosensorDeviceFactory.js'
import AbstractDeviceControllerBle from '../abstract/AbstractDeviceControllerBle.js'
import Muse2 from './variants/Muse2.js'
import MuseSAthena from './variants/MuseSAthena.js'
import MuseSGen2 from './variants/MuseSGen2.js'
import { detectMuseModel } from './MuseModelDetector.js'

export const CONTROL_UUID = '273E0001-4C4D-454D-96BE-F03BAC821358'

export const MUSE_CODENAME_MODELS: {
    pattern: string
    model: MuseDeviceModel
}[] = [
    { pattern: 'Blackcomb', model: 'Muse 2' },
    { pattern: 'Letto', model: 'Muse S Gen 2' },
    { pattern: 'Athena', model: 'Muse S Athena' },
]

export const MUSE_VARIANTS = {
    'Muse 2': Muse2,
    'Muse S Gen 2': MuseSGen2,
    'Muse S Athena': MuseSAthena,
}

export default class MuseDeviceController
    extends AbstractDeviceControllerBle
    implements DeviceControllerBle
{
    public static Class?: MuseDeviceControllerConstructor
    public static createWriteStream = fs.createWriteStream
    public static log = console.info
    public static detectModelTimeoutMs = 5000
    public static detectModelWindowMs = 500

    public static fallbackDeviceCounter = 1

    protected readonly variant: MuseVariant
    protected preConnected = false

    protected constructor(
        variant: MuseVariant,
        ble: BleController,
        recorder?: XdfRecorder
    ) {
        super(ble, recorder)

        this.variant = variant
    }

    public static async Create(options?: MuseControllerOptions) {
        const { xdfRecordPath, model, bleUuid } = options ?? {}

        const deviceModel = model ?? (await detectMuseModel(bleUuid))
        const variant = await this.createVariant(deviceModel, options)

        const ble = await this.BleDeviceController(
            variant.charCallbacks,
            options
        )

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath, variant.streamQueries)
            : undefined

        return new (this.Class ?? this)(variant, ble, recorder)
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
        options?: MuseControllerOptions
    ) {
        const MuseVariant = MUSE_VARIANTS[model]
        return await MuseVariant.Create({ ...(options ?? {}), model })
    }

    private static async BleDeviceController(
        charCallbacks: CharacteristicCallbacks,
        options?: MuseControllerOptions
    ) {
        const { bleUuid, rssiIntervalMs } = options ?? {}

        return await BleDeviceController.Create({
            charCallbacks,
            rssiIntervalMs,
            ...(bleUuid
                ? { deviceUuid: bleUuid }
                : { deviceNamePrefix: 'Muse' }),
        })
    }
}

export interface MuseVariant {
    readonly charCallbacks: CharacteristicCallbacks
    readonly streamQueries: string[]
    readonly startCommands: string[]
}

export type MuseDeviceControllerConstructor = new (
    variant: MuseVariant,
    ble: BleController,
    recorder?: XdfRecorder
) => DeviceControllerBle

export interface MuseControllerOptions extends DeviceControllerBleOptions {
    model?: MuseDeviceModel
    txtRecordPath?: string
    enableLogs?: boolean
    disableEeg?: boolean
    disablePpg?: boolean
    disableGyro?: boolean
    disableAccel?: boolean
}

export type MuseDeviceModel = 'Muse 2' | 'Muse S Gen 2' | 'Muse S Athena'
