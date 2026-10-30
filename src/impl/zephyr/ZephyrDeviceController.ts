import {
    RfcommDevice,
    RfcommDeviceController,
    ClockRegressor,
    LslOutlet,
    LslStreamOutlet,
    WindowedClockRegressor,
} from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceController,
    DeviceControllerRfcommConstructorOptions,
    DeviceControllerOptions,
    LogLevel,
    Resolve,
} from '../../types.js'
import AbstractDeviceControllerRfcomm from '../abstract/AbstractDeviceControllerRfcomm.js'

export default class ZephyrDeviceController
    extends AbstractDeviceControllerRfcomm
    implements ZephyrController
{
    public static Class?: ZephyrControllerConstructor
    public static setInterval = setInterval
    public static clearInterval = clearInterval

    public readonly deviceName = 'Zephyr BioHarness 3'

    protected readonly onData: OnRfcommData

    private readonly enabledStreams: readonly ZephyrStream[]
    private readonly ecgOutlet?: LslOutlet
    private readonly respirationOutlet?: LslOutlet
    private readonly accelOutlet?: LslOutlet
    private readonly rtorOutlet?: LslOutlet
    private lifesignInterval?: ReturnType<typeof setInterval>

    private static readonly namePrefix = 'BH BHT'
    private static readonly lifesignIntervalMs = 2000

    private static readonly stx = 0x02
    private static readonly etx = 0x03
    private static readonly fins = [0x03, 0x06, 0x15]
    private static readonly maxPayloadLength = 128
    private static readonly headerLength = 9
    private static readonly lifesignId = 0x23

    private static readonly streamQueries = [
        'type="ECG"',
        'type="RESP"',
        'type="ACCEL"',
        'type="RR"',
    ]

    private static readonly packets = {
        ECG: {
            stream: 'ECG' as const,
            packetId: 0x22,
            transmitStateId: 0x16,
            payloadLength: 88,
            sampleRateHz: 250,
            samplesPerPacket: 63,
            decode: (bytes: Buffer) =>
                ZephyrDeviceController.unpack10Bit(bytes, 63).map((v) => [
                    ZephyrDeviceController.unshift10Bit(v) * 0.025,
                ]),
        },
        Respiration: {
            stream: 'Respiration' as const,
            packetId: 0x21,
            transmitStateId: 0x15,
            payloadLength: 32,
            sampleRateHz: 1000 / 56,
            samplesPerPacket: 18,
            decode: (bytes: Buffer) =>
                ZephyrDeviceController.unpack10Bit(bytes, 18).map((v) => [
                    ZephyrDeviceController.unshift10Bit(v),
                ]),
        },
        Accelerometer: {
            stream: 'Accelerometer' as const,
            packetId: 0x2a,
            transmitStateId: 0xbc,
            payloadLength: 84,
            sampleRateHz: 50,
            samplesPerPacket: 20,
            decode: (bytes: Buffer) => {
                const g = ZephyrDeviceController.unpack10Bit(bytes, 60).map(
                    (v) => ZephyrDeviceController.toSigned10Bit(v) * 0.1
                )
                return Array.from({ length: 20 }, (_, i) =>
                    g.slice(3 * i, 3 * i + 3)
                )
            },
        },
        RtoR: {
            stream: 'RtoR' as const,
            packetId: 0x24,
            transmitStateId: 0x19,
            payloadLength: 45,
            sampleRateHz: 1000 / 56,
            samplesPerPacket: 18,
            decode: (bytes: Buffer) =>
                Array.from({ length: 18 }, (_, i) => [
                    bytes.readInt16LE(2 * i),
                ]),
        },
    }

    private static readonly streams = Object.keys(
        this.packets
    ) as ZephyrStream[]

    protected constructor(options: ZephyrControllerConstructorOptions) {
        const {
            rfcomm,
            onData,
            enabledStreams,
            recorder,
            logLevel,
            ecgOutlet,
            respirationOutlet,
            accelOutlet,
            rtorOutlet,
        } = options

        super({ rfcomm, recorder, logLevel })

        this.onData = onData
        this.enabledStreams = enabledStreams
        this.ecgOutlet = ecgOutlet
        this.respirationOutlet = respirationOutlet
        this.accelOutlet = accelOutlet
        this.rtorOutlet = rtorOutlet
    }

    public static async Create(options?: ZephyrControllerOptions) {
        const { address, xdfRecordPath, logLevel, nickname } = options ?? {}

        const disabled = this.resolveDisabledStreams(options ?? {})
        const enabledStreams = this.streams.filter((s) => !disabled.has(s))
        const isEnabled = (s: ZephyrStream) => enabledStreams.includes(s)

        const ecgOutlet = isEnabled('ECG')
            ? await this.EcgOutlet(address, nickname)
            : undefined

        const respirationOutlet = isEnabled('Respiration')
            ? await this.RespirationOutlet(address, nickname)
            : undefined

        const accelOutlet = isEnabled('Accelerometer')
            ? await this.AccelOutlet(address, nickname)
            : undefined

        const rtorOutlet = isEnabled('RtoR')
            ? await this.RtoROutlet(address, nickname)
            : undefined

        const onData = this.createOnData(
            {
                ECG: ecgOutlet,
                Respiration: respirationOutlet,
                Accelerometer: accelOutlet,
                RtoR: rtorOutlet,
            },
            logLevel
        )

        const rfcomm = this.RfcommDeviceController(address, onData)

        const recorder = await this.XdfStreamRecorder(
            xdfRecordPath,
            this.streamQueries
        )

        return new (this.Class ?? this)({
            rfcomm,
            onData,
            address,
            enabledStreams,
            recorder,
            logLevel,
            ecgOutlet,
            respirationOutlet,
            accelOutlet,
            rtorOutlet,
        })
    }

    public get outlets() {
        return [
            this.ecgOutlet,
            this.respirationOutlet,
            this.accelOutlet,
            this.rtorOutlet,
        ].filter((outlet) => outlet !== undefined)
    }

    public get streamQueries() {
        return ZephyrDeviceController.streamQueries
    }

    public get identifier() {
        return this.rfcomm.address
    }

    protected get deviceId() {
        return this.rfcomm.address
    }

    protected async handleConnect() {
        await super.handleConnect()

        this.lifesignInterval = ZephyrDeviceController.setInterval(
            () => this.sendLifesign(),
            ZephyrDeviceController.lifesignIntervalMs
        )
    }

    // The device drops the link unless it hears from us every few seconds.
    private sendLifesign() {
        this.rfcomm
            .write(
                ZephyrDeviceController.encodeMessage(
                    ZephyrDeviceController.lifesignId,
                    []
                )
            )
            .catch((err: Error) =>
                this.warn(`Lifesign to ${this.deviceId} failed: ${err.message}`)
            )
    }

    protected async handleStartStreaming() {
        await this.setTransmitStates(1)
    }

    protected async handleStopStreaming() {
        await this.setTransmitStates(0)
    }

    private async setTransmitStates(state: 0 | 1) {
        for (const stream of this.enabledStreams) {
            const { transmitStateId } = ZephyrDeviceController.packets[stream]

            await this.rfcomm.write(
                ZephyrDeviceController.encodeMessage(transmitStateId, [state])
            )
        }
    }

    protected async handleDisconnect() {
        ZephyrDeviceController.clearInterval(this.lifesignInterval)
        delete this.lifesignInterval

        await super.handleDisconnect()
    }

    private static createOnData(
        outlets: Partial<Record<ZephyrStream, LslOutlet>>,
        logLevel?: LogLevel
    ): OnRfcommData {
        const readFrames = this.createFrameReader()

        const handlers = new Map(
            Object.values(this.packets)
                .filter(({ stream }) => outlets[stream])
                .map((packet) => [
                    packet.packetId,
                    {
                        packet,
                        outlet: outlets[packet.stream]!,
                        regressor: this.WindowedClockRegressor(
                            packet.sampleRateHz
                        ),
                        lastDeviceTime: -Infinity,
                    },
                ])
        )

        return (data, _length, timestampSec) => {
            for (const { packetId, payload } of readFrames(data)) {
                const handler = handlers.get(packetId)
                const { packet } = handler ?? {}

                if (!handler || payload.length !== packet!.payloadLength) {
                    continue
                }

                const samples = packet!.decode(
                    payload.subarray(this.headerLength)
                )

                const deviceTime =
                    this.readDeviceTime(payload) +
                    (samples.length - 1) / packet!.sampleRateHz

                if (deviceTime <= handler.lastDeviceTime) {
                    continue
                }
                handler.lastDeviceTime = deviceTime

                const timestamps = handler.regressor.deriveTimestamps(
                    deviceTime,
                    timestampSec,
                    samples.length
                )

                samples.forEach((sample, i) =>
                    handler.outlet.pushSample(sample, timestamps[i]!)
                )

                if (logLevel === 'info') {
                    this.log.info(timestampSec, packet!.stream, samples)
                }
            }
        }
    }

    private static createFrameReader() {
        let buffer = Buffer.alloc(0)

        return (data: Buffer) => {
            buffer = Buffer.concat([buffer, data])

            const frames: { packetId: number; payload: Buffer }[] = []
            let start = 0

            while (true) {
                const stx = buffer.indexOf(this.stx, start)

                if (stx === -1) {
                    start = buffer.length
                    break
                }

                if (buffer.length - stx < 3) {
                    start = stx
                    break
                }

                const payloadLength = buffer[stx + 2]!
                const end = stx + 5 + payloadLength

                if (payloadLength > this.maxPayloadLength) {
                    start = stx + 1
                    continue
                }

                if (buffer.length < end) {
                    start = stx
                    break
                }

                const payload = buffer.subarray(stx + 3, end - 2)
                const crc = buffer[end - 2]
                const fin = buffer[end - 1]!

                if (crc !== this.crc8(payload) || !this.fins.includes(fin)) {
                    start = stx + 1
                    continue
                }

                frames.push({
                    packetId: buffer[stx + 1]!,
                    payload: Buffer.from(payload),
                })
                start = end
            }

            buffer = buffer.subarray(start)
            return frames
        }
    }

    private static readDeviceTime(payload: Buffer) {
        const year = payload.readUInt16LE(1)
        const month = payload[3]!
        const day = payload[4]!
        const msOfDay = payload.readUInt32LE(5)

        return Date.UTC(year, month - 1, day) / 1000 + msOfDay / 1000
    }

    private static crc8(payload: Uint8Array) {
        let crc = 0

        for (const byte of payload) {
            crc ^= byte
            for (let bit = 0; bit < 8; bit++) {
                crc = crc & 1 ? (crc >> 1) ^ 0x8c : crc >> 1
            }
        }

        return crc
    }

    private static encodeMessage(packetId: number, payload: number[]) {
        const bytes = Uint8Array.from(payload)

        return Buffer.from([
            this.stx,
            packetId,
            bytes.length,
            ...bytes,
            this.crc8(bytes),
            this.etx,
        ])
    }

    private static unpack10Bit(bytes: Buffer, count: number) {
        const values: number[] = []

        for (let i = 0; i < count; i++) {
            const bit = i * 10
            const word = bytes[bit >> 3]! | ((bytes[(bit >> 3) + 1] ?? 0) << 8)
            values.push((word >> (bit & 7)) & 0x3ff)
        }

        return values
    }

    private static unshift10Bit(value: number) {
        return value === 0 ? NaN : value - 512
    }

    private static toSigned10Bit(value: number) {
        return value & 0x200 ? value - 1024 : value
    }

    private static WindowedClockRegressor(nominalHz: number): ClockRegressor {
        return WindowedClockRegressor.Create(nominalHz)
    }

    private static RfcommDeviceController(
        address: string | undefined,
        onData: OnRfcommData
    ) {
        return RfcommDeviceController.Create({
            onData,
            address,
            namePrefix: this.namePrefix,
        })
    }

    private static async LslOutlet(
        params: {
            name: string
            type: string
            sourceId: string
            channelNames: string[]
            sampleRateHz: number
            units: string
            chunkSize: number
        },
        nickname?: string
    ) {
        return await LslStreamOutlet.Create({
            ...this.describedBy(nickname),
            ...params,
            channelFormat: 'float32',
            manufacturer: 'Zephyr',
        })
    }

    private static async EcgOutlet(address?: string, nickname?: string) {
        return await this.LslOutlet(
            {
                name: `Zephyr ECG (${address})`,
                type: 'ECG',
                sourceId: `zephyr-ecg-${address}`,
                channelNames: ['ECG'],
                sampleRateHz: this.packets.ECG.sampleRateHz,
                units: 'millivolt',
                chunkSize: this.packets.ECG.samplesPerPacket,
            },
            nickname
        )
    }

    private static async RespirationOutlet(
        address?: string,
        nickname?: string
    ) {
        return await this.LslOutlet(
            {
                name: `Zephyr Respiration (${address})`,
                type: 'RESP',
                sourceId: `zephyr-respiration-${address}`,
                channelNames: ['Respiration'],
                sampleRateHz: this.packets.Respiration.sampleRateHz,
                units: 'unnormalized',
                chunkSize: this.packets.Respiration.samplesPerPacket,
            },
            nickname
        )
    }

    private static async AccelOutlet(address?: string, nickname?: string) {
        return await this.LslOutlet(
            {
                name: `Zephyr Accelerometer (${address})`,
                type: 'ACCEL',
                sourceId: `zephyr-accelerometer-${address}`,
                channelNames: ['X', 'Y', 'Z'],
                sampleRateHz: this.packets.Accelerometer.sampleRateHz,
                units: 'g',
                chunkSize: this.packets.Accelerometer.samplesPerPacket,
            },
            nickname
        )
    }

    private static async RtoROutlet(address?: string, nickname?: string) {
        return await this.LslOutlet(
            {
                name: `Zephyr R-to-R (${address})`,
                type: 'RR',
                sourceId: `zephyr-rtor-${address}`,
                channelNames: ['RtoR'],
                sampleRateHz: this.packets.RtoR.sampleRateHz,
                units: 'millisecond',
                chunkSize: this.packets.RtoR.samplesPerPacket,
            },
            nickname
        )
    }
}

export interface ZephyrController extends DeviceController {}

export type ZephyrControllerOptions = Resolve<
    DeviceControllerOptions<ZephyrStream> & {
        address?: string
    }
>

export type ZephyrControllerConstructor = new (
    options: ZephyrControllerConstructorOptions
) => ZephyrController

export interface ZephyrControllerConstructorOptions extends DeviceControllerRfcommConstructorOptions {
    rfcomm: RfcommDevice
    onData: OnRfcommData
    enabledStreams: readonly ZephyrStream[]
    address?: string
    recorder?: XdfRecorder
    logLevel?: LogLevel
    ecgOutlet?: LslOutlet
    respirationOutlet?: LslOutlet
    accelOutlet?: LslOutlet
    rtorOutlet?: LslOutlet
}

export type OnRfcommData = (
    data: Buffer,
    length: number,
    timestampSec: number
) => void

export type ZephyrStream = 'ECG' | 'Respiration' | 'Accelerometer' | 'RtoR'
