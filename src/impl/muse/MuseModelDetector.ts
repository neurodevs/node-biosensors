import koffi from 'koffi'
import { BleController, BleDeviceController } from '@neurodevs/node-lsl'

import {
    CONTROL_UUID,
    MUSE_CODENAME_MODELS,
    MuseDeviceModel,
} from './MuseDeviceController.js'

export async function detectMuseModel(bleUuid?: string) {
    const detector = await MuseModelDetector.Create(bleUuid)
    return await detector.detectModel()
}

export default class MuseModelDetector implements MuseDetector {
    public static Class?: MuseDetectorConstructor
    public static detectModelTimeoutMs = 5000
    public static detectModelWindowMs = 500

    protected ble: BleController
    protected controlBuffer: ControlBuffer

    protected constructor(ble: BleController, controlBuffer: ControlBuffer) {
        this.ble = ble
        this.controlBuffer = controlBuffer
    }

    public static async Create(bleUuid?: string) {
        const controlBuffer = { text: '' }
        const ble = await this.BleDeviceController(bleUuid, controlBuffer)

        return new (this.Class ?? this)(ble, controlBuffer)
    }

    public async detectModel() {
        await this.ble.connect()

        const response = await this.readControlResponse()
        const model = this.resolveModelFrom(response)

        await this.ble.disconnect()

        return model
    }

    protected readControlResponse = async () => {
        const deadline = Date.now() + MuseModelDetector.detectModelTimeoutMs

        do {
            await this.ble.writeCharacteristic(CONTROL_UUID, 'v6')
            await this.checkForUpdates()

            if (this.isControlBufferComplete) {
                return this.controlBuffer.text
            }
        } while (Date.now() < deadline)

        return this.controlBuffer.text
    }

    private async checkForUpdates() {
        const deadline = Date.now() + MuseModelDetector.detectModelWindowMs

        do {
            if (this.isControlBufferComplete) {
                return this.controlBuffer.text
            }

            await new Promise((resolve) => setTimeout(resolve, 20))
        } while (Date.now() < deadline)

        return this.controlBuffer.text
    }

    private get isControlBufferComplete() {
        const trimmed = this.controlBuffer.text.trim()
        return /"rc"\s*:/.test(trimmed) && trimmed.endsWith('}')
    }

    private resolveModelFrom(controlResponse: string) {
        const match = controlResponse.match(/"sp"\s*:\s*"([^"]*)"/)
        const codename = match?.[1] ?? ''

        for (const { pattern, model } of MUSE_CODENAME_MODELS) {
            if (codename.startsWith(pattern)) {
                return model
            }
        }

        throw new Error(
            `Could not resolve Muse model from unknown CONTROL hardware codename "${codename}" (sp field)! Response: ${controlResponse}.`
        )
    }

    private static genControlCharCallback(controlBuffer: ControlBuffer) {
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

    private static async BleDeviceController(
        bleUuid: string | undefined,
        controlBuffer: ControlBuffer
    ) {
        return await BleDeviceController.Create({
            charCallbacks: [this.genControlCharCallback(controlBuffer)],
            ...(bleUuid
                ? { deviceUuid: bleUuid }
                : { deviceNamePrefix: 'Muse' }),
        })
    }
}

export interface MuseDetector {
    detectModel(bleUuid?: string): Promise<MuseDeviceModel>
}

export type MuseDetectorConstructor = new (
    ble: BleController,
    controlBuffer: ControlBuffer
) => MuseDetector

export type ControlBuffer = { text: string }
