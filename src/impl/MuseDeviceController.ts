import {
    BleController,
    BleDeviceController,
    LslStreamOutlet,
} from '@neurodevs/node-lsl'
import koffi from 'koffi'

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
    public static log? = console.info

    protected readonly ble: BleController

    protected isConnected = false
    protected isStreaming = false

    protected constructor(ble: BleController) {
        this.ble = ble
    }

    public static async Create(options: MuseControllerOptions) {
        const { disableEeg, disablePpg } = options

        const ble = await this.BleDeviceController(options)

        if (!disableEeg) {
            await this.EegLslOutlet()
        }

        if (!disablePpg) {
            await this.PpgLslOutlet()
        }

        return new (this.Class ?? this)(ble)
    }

    public async connect() {
        await this.ble.connect()
    }

    public async startStreaming() {
        for (const cmd of ['h', 'p50', 's', 'd']) {
            await this.ble.writeCharacteristic(CONTROL_UUID, cmd)
        }
        this.isStreaming = true
    }

    public async stopStreaming() {
        await this.ble.writeCharacteristic(CONTROL_UUID, 'h')
        this.isStreaming = false
    }

    public async disconnect() {
        if (this.isStreaming) {
            await this.stopStreaming()
        }
        await this.ble.disconnect()
    }

    public get bleUuid() {
        return this.ble.uuid
    }

    public get bleName() {
        return this.ble.name
    }

    private static generateCharCallbacks(enableLogs?: boolean) {
        const log = enableLogs ? this.log : undefined

        return Object.entries(MUSE_CHAR_UUIDS).map(([name, uuid]) => {
            return {
                charUuid: uuid,
                charName: name,
                onData: (data: Buffer, length: number, timestamp: number) => {
                    const bytes = Array.from(
                        koffi.decode(data, 'uint8', length)
                    )
                    log?.(`[${timestamp}]`, name, bytes)
                },
            }
        })
    }

    private static async BleDeviceController(options: MuseControllerOptions) {
        const { bleUuid, rssiIntervalMs, enableLogs } = options

        return await BleDeviceController.Create({
            deviceUuid: bleUuid,
            rssiIntervalMs,
            charCallbacks: this.generateCharCallbacks(enableLogs),
        })
    }

    private static async EegLslOutlet() {
        await LslStreamOutlet.Create({
            name: 'Muse EEG',
            type: 'EEG',
            channelNames: [
                'EEG_TP9',
                'EEG_AF7',
                'EEG_AF8',
                'EEG_TP10',
                'EEG_AUX',
            ],
            sampleRateHz: 256,
            channelFormat: 'float32',
            sourceId: 'muse-eeg',
            manufacturer: 'Interaxon Inc.',
            units: 'microvolt',
            chunkSize: 1,
        })
    }

    private static async PpgLslOutlet() {
        await LslStreamOutlet.Create({
            name: 'Muse PPG',
            type: 'PPG',
            channelNames: ['PPG_AMBIENT', 'PPG_INFRARED', 'PPG_RED'],
            sampleRateHz: 64,
            channelFormat: 'float32',
            sourceId: 'muse-s-ppg',
            manufacturer: 'Interaxon Inc.',
            units: 'N/A',
            chunkSize: 1,
        })
    }
}

export interface MuseController {
    connect(): Promise<void>
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
    readonly bleUuid: string
    readonly bleName: string
}

export interface MuseControllerOptions {
    bleUuid: string
    enableLogs?: boolean
    rssiIntervalMs?: number
    disableEeg?: boolean
    disablePpg?: boolean
}

export type MuseControllerConstructor = new (
    ble: BleController
) => MuseController
