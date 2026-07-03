import fs from 'node:fs'

import {
    BleController,
    BleDeviceController,
    CharacteristicCallbacks,
} from '@neurodevs/node-lsl'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

import {
    DeviceControllerBle,
    DeviceControllerBleOptions,
} from '../BiosensorDeviceFactory.js'
import AbstractDeviceControllerBle from '../abstract/AbstractDeviceControllerBle.js'
import Muse2 from './variants/Muse2.js'
import MuseSAthena from './variants/MuseSAthena.js'
import MuseSGen2 from './variants/MuseSGen2.js'

export const CONTROL_UUID = '273E0001-4C4D-454D-96BE-F03BAC821358'

export default class MuseDeviceController
    extends AbstractDeviceControllerBle
    implements DeviceControllerBle
{
    public static Class?: MuseDeviceControllerConstructor
    public static createWriteStream = fs.createWriteStream
    public static log = console.info
    public static fallbackDeviceCounter = 1

    private readonly variant: MuseVariant

    protected constructor(
        variant: MuseVariant,
        ble: BleController,
        recorder?: XdfRecorder
    ) {
        super(ble, recorder)

        this.variant = variant
    }

    public static async Create(
        model: MuseDeviceModel,
        options?: MuseControllerOptions
    ) {
        const { xdfRecordPath } = options ?? {}

        const MuseVariant = await this.resolveVariant(model)
        const variant = await MuseVariant.Create(options)

        const ble = await this.BleDeviceController(
            variant.charCallbacks,
            options
        )

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(variant.streamQueries, xdfRecordPath)
            : undefined

        return new (this.Class ?? this)(variant, ble, recorder)
    }

    private static async resolveVariant(model: MuseDeviceModel) {
        switch (model) {
            case 'Muse 2':
                return Muse2
            case 'Muse S Athena':
                return MuseSAthena
            case 'Muse S Gen 2':
                return MuseSGen2
        }
    }

    protected get deviceId() {
        return this.bleUuid
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

    public get streamQueries() {
        return this.variant.streamQueries
    }

    private static async BleDeviceController(
        charCallbacks: CharacteristicCallbacks,
        options?: MuseControllerOptions
    ) {
        const { bleUuid, rssiIntervalMs } = options ?? {}

        const bleOptions = {
            charCallbacks,
            rssiIntervalMs,
        }

        if (bleUuid) {
            return await BleDeviceController.Create({
                ...bleOptions,
                deviceUuid: bleUuid,
            })
        } else {
            return await BleDeviceController.Create({
                ...bleOptions,
                deviceNamePrefix: 'Muse',
            })
        }
    }

    private static XdfStreamRecorder(
        streamQueries: string[],
        xdfRecordPath: string
    ) {
        return XdfStreamRecorder.Create(xdfRecordPath, streamQueries)
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
    txtRecordPath?: string
    enableLogs?: boolean
    disableEeg?: boolean
    disablePpg?: boolean
    disableGyro?: boolean
    disableAccel?: boolean
}

export type MuseDeviceModel = 'Muse 2' | 'Muse S Gen 2' | 'Muse S Athena'
