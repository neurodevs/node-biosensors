// Byte definitions
// 0: Packet header (value: 255)
// 1: Packet counter (values: 0-127)
// 2–64: EEG data (21 channels, 3 bytes each, values: 0–254)
// 65–73: Accelerometer data (3 channels, 3 bytes each, values: 0–254)
// 74: Impedance check (0x11 [ie. 17] ON, 0x12 [ie. 18] OFF)
// 75: Battery voltage (value: 0–255)
// 76-77: Trigger (value: 0–255)

import { ChannelFormat } from '@neurodevs/ndx-native'
import {
    LslOutlet,
    LslStreamOutlet,
    UsbDevice,
    UsbDeviceController,
    UsbDeviceOptions,
} from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

import { DeviceController, LogLevel } from '../../types.js'
import AbstractDeviceControllerUsb from '../abstract/AbstractDeviceControllerUsb.js'

export default class CgxDeviceController
    extends AbstractDeviceControllerUsb
    implements DeviceController
{
    public static Class?: CgxControllerConstructor

    public static readonly streamQueries = ['type="EEG"', 'type="ACCEL"']

    public readonly deviceName = 'Cognionics Quick-20r'

    protected numPacketsDropped = 0

    private readonly eegOutlet: LslOutlet
    private readonly accelOutlet: LslOutlet
    private readonly serialNumber?: string

    private packetCounter?: number

    protected constructor(options: CgxControllerConstructorOptions) {
        const {
            usb,
            onPacket,
            eegOutlet,
            accelOutlet,
            serialNumber,
            recorder,
            logLevel,
        } = options

        super({ usb, recorder, logLevel })

        this.eegOutlet = eegOutlet
        this.accelOutlet = accelOutlet
        this.serialNumber = serialNumber

        onPacket((packet) => this.handlePacket(packet))
    }

    public static async Create(options?: CgxControllerOptions) {
        const { serialNumber, xdfRecordPath, logLevel } = options ?? {}

        const eegOutlet = await this.EegOutlet()
        const accelOutlet = await this.AccelOutlet()

        const { onData, onPacket } = this.createPacketReassembler()
        const usb = this.UsbDeviceController(onData, serialNumber)

        const recorder = await this.XdfStreamRecorder(
            xdfRecordPath,
            this.streamQueries
        )

        return new (this.Class ?? this)({
            usb,
            onPacket,
            eegOutlet,
            accelOutlet,
            serialNumber,
            recorder,
            logLevel,
        })
    }

    protected async handleStartStreaming() {
        await this.turnOnImpedanceCheck()
    }

    private async turnOnImpedanceCheck() {
        await this.usb.writeUsb('\x11')
    }

    protected async handleStopStreaming() {}

    private handlePacket(packet: Uint8Array) {
        this.handlePacketCounter(packet)

        if (this.state === 'streaming') {
            this.decode24BitEeg(packet)
            this.decode24BitAccelerometer(packet)
        }
    }

    private handlePacketCounter(packet: Uint8Array) {
        const current = packet[1]

        if (this.packetCounter === undefined) {
            this.packetCounter = current
            return
        }

        const expected = (this.packetCounter + 1) % 255

        if (current !== expected && current !== 0) {
            this.numPacketsDropped++
            this.warn(`Dropped packet ${current} / ${expected}`)
        }

        this.packetCounter = current
    }

    private decode24BitEeg(packet: Uint8Array) {
        const eegData = []

        for (let i = 0; i < this.numEegChannels; i++) {
            const startIdx = 2 + i * 3
            const firstByte = packet[startIdx]
            const secondByte = packet[startIdx + 1]
            const thirdByte = packet[startIdx + 2]

            const rawValue =
                ((firstByte << 24) >>> 0) +
                ((secondByte << 17) >>> 0) +
                ((thirdByte << 10) >>> 0)

            const volts = rawValue * (5.0 / 3.0) * (1.0 / Math.pow(2, 32))
            eegData.push(volts)
        }

        this.eegOutlet.pushSample(eegData)
    }

    private get numEegChannels() {
        return CgxDeviceController.eegCharacteristicNames.length
    }

    private decode24BitAccelerometer(packet: Uint8Array) {
        const accelData = []

        for (let i = 0; i < this.numAccelChannels; i++) {
            const startIdx = 65 + i * 3
            const firstByte = packet[startIdx]
            const secondByte = packet[startIdx + 1]
            const thirdByte = packet[startIdx + 2]

            const rawValue =
                ((firstByte << 24) >>> 0) +
                ((secondByte << 17) >>> 0) +
                ((thirdByte << 10) >>> 0)

            const volts = rawValue * 2.5 * (1.0 / Math.pow(2, 32))
            accelData.push(volts)
        }

        this.accelOutlet.pushSample(accelData)
    }

    private get numAccelChannels() {
        return CgxDeviceController.accelCharacteristicNames.length
    }

    protected get deviceId() {
        return this.serialNumber ?? this.deviceName
    }

    public get outlets() {
        return [this.eegOutlet, this.accelOutlet]
    }

    public get streamQueries() {
        return CgxDeviceController.streamQueries
    }

    private static createPacketReassembler() {
        let pending: Buffer = Buffer.alloc(0)
        let handlePacket: (packet: Uint8Array) => void = () => {}

        const onPacket = (handler: (packet: Uint8Array) => void) => {
            handlePacket = handler
        }

        const onData: UsbDeviceOptions['onData'] = (data) => {
            pending = Buffer.concat([pending, data])

            for (;;) {
                pending = this.fromFirstHeader(pending)

                if (pending.length < this.bytesPerPacket) {
                    return
                }

                const nextHeader = this.indexOfHeaderInsidePacket(pending)

                if (nextHeader !== -1) {
                    pending = pending.subarray(nextHeader)
                    continue
                }

                handlePacket(
                    Uint8Array.from(pending.subarray(0, this.bytesPerPacket))
                )
                pending = pending.subarray(this.bytesPerPacket)
            }
        }

        return { onData, onPacket }
    }

    private static fromFirstHeader(bytes: Buffer) {
        const header = bytes.indexOf(this.headerByte)
        return header === -1 ? Buffer.alloc(0) : bytes.subarray(header)
    }

    private static indexOfHeaderInsidePacket(bytes: Buffer) {
        const header = bytes
            .subarray(1, this.firstByteThatMayEqualHeader)
            .indexOf(this.headerByte)

        return header === -1 ? -1 : header + 1
    }

    private static readonly bytesPerPacket = 78
    private static readonly headerByte = 0xff
    private static readonly firstByteThatMayEqualHeader = 75

    private static readonly baudRate = 1000000

    private static UsbDeviceController(
        onData: UsbDeviceOptions['onData'],
        serialNumber?: string
    ) {
        return UsbDeviceController.Create({
            onData,
            serialNumber,
            baudRate: this.baudRate,
            usesRtsCts: true,
        })
    }

    private static readonly eegCharacteristicNames = [
        'F7',
        'Fp1',
        'Fp2',
        'F8',
        'F3',
        'Fz',
        'F4',
        'C3',
        'Cz',
        'P8',
        'P7',
        'Pz',
        'P4',
        'T3',
        'P3',
        'O1',
        'O2',
        'C4',
        'T4',
        'A2',
        'A1',
    ]

    private static readonly eegOptions = {
        sourceId: 'cgx-eeg',
        name: 'CGX Quick-20r (Cognionics) EEG',
        type: 'EEG',
        channelNames: this.eegCharacteristicNames,
        sampleRateHz: 500,
        channelFormat: 'float32' as ChannelFormat,
        manufacturer: 'CGX Systems',
        units: 'microvolt',
        chunkSize: 1,
    }

    private static readonly accelCharacteristicNames = [
        'X_ACCEL',
        'Y_ACCEL',
        'Z_ACCEL',
    ]

    private static readonly accelOptions = {
        sourceId: 'cgx-accel',
        name: 'CGX Quick-20r (Cognionics) Accelerometer',
        type: 'ACCEL',
        channelNames: this.accelCharacteristicNames,
        sampleRateHz: 500,
        channelFormat: 'float32' as ChannelFormat,
        manufacturer: 'CGX Systems',
        units: 'Unknown',
        chunkSize: 1,
    }

    private static async EegOutlet() {
        return await LslStreamOutlet.Create(this.eegOptions)
    }

    private static async AccelOutlet() {
        return await LslStreamOutlet.Create(this.accelOptions)
    }
}

export interface CgxControllerOptions {
    serialNumber?: string
    xdfRecordPath?: string
    logLevel?: LogLevel
}

export type CgxControllerConstructor = new (
    options: CgxControllerConstructorOptions
) => DeviceController

export interface CgxControllerConstructorOptions {
    usb: UsbDevice
    onPacket: (handler: (packet: Uint8Array) => void) => void
    eegOutlet: LslOutlet
    accelOutlet: LslOutlet
    serialNumber?: string
    recorder?: XdfRecorder
    logLevel?: LogLevel
}
