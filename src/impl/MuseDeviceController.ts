import { BleController, BleDeviceController } from '@neurodevs/node-lsl'

export const MUSE_CHAR_UUIDS: Record<string, string> = {
    CONTROL: '273E0001-4C4D-454D-96BE-F03BAC821358',
    TELEMETRY: '273E000B-4C4D-454D-96BE-F03BAC821358',
    GYROSCOPE: '273E0009-4C4D-454D-96BE-F03BAC821358',
    ACCELEROMETER: '273E000A-4C4D-454D-96BE-F03BAC821358',
    PPG_AMBIENT: '273E000F-4C4D-454D-96BE-F03BAC821358',
    PPG_INFRARED: '273E0010-4C4D-454D-96BE-F03BAC821358',
    PPG_RED: '273E0011-4C4D-454D-96BE-F03BAC821358',
    EEG_TP9: '273E0003-4C4D-454D-96BE-F03BAC821358',
    EEG_AF7: '273E0004-4C4D-454D-96BE-F03BAC821358',
    EEG_AF8: '273E0005-4C4D-454D-96BE-F03BAC821358',
    EEG_TP10: '273E0006-4C4D-454D-96BE-F03BAC821358',
    EEG_AUX: '273E0007-4C4D-454D-96BE-F03BAC821358',
}

export const CONTROL_UUID = MUSE_CHAR_UUIDS['CONTROL']

export default class MuseDeviceController implements MuseController {
    public static Class?: MuseControllerConstructor

    protected readonly ble: BleController

    protected constructor(ble: BleController) {
        this.ble = ble
    }

    public static async Create(options: MuseControllerOptions) {
        const { deviceUuid } = options

        const ble = await BleDeviceController.Create({
            deviceUuid,
            charCallbacks: this.generateCharCallbacks(),
        })

        return new (this.Class ?? this)(ble)
    }

    public async startStreaming() {
        await this.ble.connect()

        for (const cmd of ['h', 'p50', 's', 'd']) {
            await this.ble.writeCharacteristic(CONTROL_UUID, cmd)
        }
    }

    public async stopStreaming() {
        await this.ble.writeCharacteristic(CONTROL_UUID, 'h')
    }

    public async disconnect() {
        await this.ble.disconnect()
    }

    public get bleName() {
        return this.ble.name
    }

    private static generateCharCallbacks() {
        return Object.entries(MUSE_CHAR_UUIDS).map(([name, uuid]) => {
            return {
                charUuid: uuid,
                charName: name,
                onData: (
                    _data: Buffer,
                    _length: number,
                    _timestamp: number
                ) => {},
            }
        })
    }
}

export interface MuseController {
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
    readonly bleName: string
}

export interface MuseControllerOptions {
    deviceUuid: string
}

export type MuseControllerConstructor = new (
    ble: BleController
) => MuseController
