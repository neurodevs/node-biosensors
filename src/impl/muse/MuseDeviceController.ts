import fs from 'node:fs'

import koffi from 'koffi'
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
        const { xdfRecordPath, model: passedModel } = options ?? {}

        let ble: BleController
        let variant: MuseVariant
        let preConnected = false

        if (passedModel) {
            variant = await this.createVariant(passedModel, options)
            ble = await this.BleDeviceController(variant.charCallbacks, options)
        } else {
            const controlBuffer = { text: '' }

            ble = await this.BleDeviceController(
                [this.genControlCharCallback(controlBuffer)],
                options
            )

            await ble.connect()
            preConnected = true

            const response = await this.readControlResponse(ble, controlBuffer)
            const model = this.resolveModelFrom(response)

            variant = await this.createVariant(model, options)

            await ble.subscribeCharacteristics(variant.charCallbacks)
        }

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath, variant.streamQueries)
            : undefined

        const controller = new (this.Class ?? this)(variant, ble, recorder)

        if (preConnected && controller instanceof MuseDeviceController) {
            controller.preConnected = true
        }

        return controller
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

    private static genControlCharCallback(controlBuffer: { text: string }) {
        return {
            charUuid: CONTROL_UUID,
            charName: 'CONTROL',
            onData: (data: Buffer, length: number) => {
                controlBuffer.text += this.decodeControlFragment(data, length)
            },
        }
    }

    private static decodeControlFragment(data: Buffer, length: number) {
        const bytes = Array.from<number>(koffi.decode(data, 'uint8', length))
        const fragmentLength = Math.min(bytes[0]!, bytes.length - 1)
        const asciiBytes = bytes.slice(1, 1 + fragmentLength)

        return String.fromCharCode(...asciiBytes)
    }

    private static readControlResponse = async (
        ble: BleController,
        controlBuffer: {
            text: string
        }
    ) => {
        const deadline = Date.now() + this.detectModelTimeoutMs

        do {
            await ble?.writeCharacteristic(CONTROL_UUID, 'v6')

            const text = await this.checkForUpdates(controlBuffer)

            if (this.isControlBufferComplete(text)) {
                return text
            }
        } while (Date.now() < deadline)

        return controlBuffer.text
    }

    private static async checkForUpdates(controlBuffer: { text: string }) {
        const deadline = Date.now() + this.detectModelWindowMs

        do {
            if (this.isControlBufferComplete(controlBuffer.text)) {
                return controlBuffer.text
            }

            await new Promise((resolve) => setTimeout(resolve, 20))
        } while (Date.now() < deadline)

        return controlBuffer.text
    }

    private static isControlBufferComplete(text: string) {
        const trimmed = text.trim()
        return /"rc"\s*:/.test(trimmed) && trimmed.endsWith('}')
    }

    private static resolveModelFrom(controlResponse: string) {
        const match = controlResponse.match(/"sp"\s*:\s*"([^"]*)"/)
        const codename = match?.[1] ?? ''

        for (const { pattern, model } of MUSE_CODENAME_MODELS) {
            if (codename.startsWith(pattern)) {
                return model
            }
        }

        throw new Error(
            `Could not resolve Muse model from unknown CONTROL hardware codename "${codename}" (sp field)! Response: ${controlResponse}`
        )
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
