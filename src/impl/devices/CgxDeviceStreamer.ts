// Byte definitions
// 0: Packet header (value: 255)
// 1: Packet counter (values: 0-127)
// 2–64: EEG data (21 channels, 3 bytes each, values: 0–254)
// 65–73: Accelerometer data (3 channels, 3 bytes each, values: 0–254)
// 74: Impedance check (0x11 [ie. 17] ON, 0x12 [ie. 18] OFF)
// 75: Battery voltage (value: 0–255)
// 76-77: Trigger (value: 0–255)

import { ChannelFormat } from '@neurodevs/ndx-native'
import { StreamOutlet, LslStreamOutlet } from '@neurodevs/node-lsl'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'
import FTDI from 'ftdi-d2xx'

import { DeviceStreamer } from 'impl/BiosensorDeviceFactory.js'

export default class CgxDeviceStreamer implements DeviceStreamer {
    public static Class?: CgxDeviceStreamerConstructor
    public static FTDI = FTDI
    public static readonly streamQueries = ['type="EEG"', 'type="ACCEL"']

    public isRunning = false
    protected numPacketsDropped = 0

    private eegOutlet: StreamOutlet
    private accelOutlet: StreamOutlet
    private xdfRecorder?: XdfRecorder

    private infos!: FTDI.FTDI_DeviceInfo[]
    private device!: FTDI.FTDI_Device
    private packetCounter!: number

    private readonly readTimeoutMs = 1000
    private readonly writeTimeoutMs = 1000
    private readonly latencyTimerMs = 4
    private readonly bytesPerSample = 78
    private readonly baudRate = 1000000
    private readonly seventeenInHex = 0x11
    private readonly nineteenInHex = 0x13
    private readonly ftdiFlowControlMode = FTDI.FT_FLOW_RTS_CTS
    private readonly ftdiReadBuffer = FTDI.FT_PURGE_RX
    private readonly eightDataBits = FTDI.FT_BITS_8
    private readonly oneStopBit = FTDI.FT_STOP_BITS_1
    private readonly noParityBit = FTDI.FT_PARITY_NONE

    protected constructor(options: CgxDeviceStreamerConstructorOptions) {
        const { eegOutlet, accelOutlet, xdfRecorder } = options

        this.eegOutlet = eegOutlet
        this.accelOutlet = accelOutlet
        this.xdfRecorder = xdfRecorder
    }

    public static async Create(options?: CgxDeviceStreamerOptions) {
        const { xdfRecordPath } = options ?? {}

        const eegOutlet = await this.EegOutlet()
        const accelOutlet = await this.AccelOutlet()

        const xdfRecorder = await this.createXdfRecorderIfPath(xdfRecordPath)

        return new (this.Class ?? this)({
            eegOutlet,
            accelOutlet,
            xdfRecorder,
            xdfRecordPath,
        })
    }

    public async startStreaming() {
        this.isRunning = true
        this.startXdfRecorderIfExists()

        await this.connectFtdi()
        await this.startReadingPackets()
    }

    private startXdfRecorderIfExists() {
        this.xdfRecorder?.start()
    }

    private async connectFtdi() {
        await this.loadFtdiDeviceInfos()
        await this.openDeviceBySerialNumber()

        this.configureDevice()
    }

    private async loadFtdiDeviceInfos() {
        this.infos = await this.FTDI.getDeviceInfoList()
        this.throwIfDeviceNotFound()
    }

    private throwIfDeviceNotFound() {
        if (this.infos.length === 0) {
            throw new Error(this.notFoundError)
        }
    }

    private readonly notFoundError = `
        \n FTDI device not found for the CGX headset!
        \n Please make sure the Bluetooth dongle is connected and FTDI D2XX drivers are installed: 
        \n - https://ftdichip.com/drivers/d2xx-drivers/
        \n
    `

    private async openDeviceBySerialNumber() {
        this.device = await this.FTDI.openDevice(this.serialNumber)
    }

    private get serialNumber() {
        return this.infos[0].serial_number
    }

    private configureDevice() {
        this.setReadAndWriteTimeouts()
        this.purgeReadBuffer()
        this.setFlowControl()
        this.setBaudRate()
        this.setDataCharacteristics()
        this.setLatencyTimer()
    }

    private setReadAndWriteTimeouts() {
        this.device.setTimeouts(this.readTimeoutMs, this.writeTimeoutMs)
    }

    private purgeReadBuffer() {
        this.device.purge(this.ftdiReadBuffer)
    }

    private setFlowControl() {
        this.device.setFlowControl(
            this.ftdiFlowControlMode,
            this.seventeenInHex,
            this.nineteenInHex
        )
    }

    private setBaudRate() {
        this.device.setBaudRate(this.baudRate)
    }

    private setDataCharacteristics() {
        this.device.setDataCharacteristics(
            this.eightDataBits,
            this.oneStopBit,
            this.noParityBit
        )
    }

    private setLatencyTimer() {
        this.device.setLatencyTimer(this.latencyTimerMs)
    }

    private async startReadingPackets() {
        while (this.isRunning) {
            try {
                await this.readPacket()
            } catch {
                return
            }
        }
    }

    private async readPacket() {
        const packet = await this.readPacketAndEnsureAlignment()
        this.handlePacketCounter(packet)

        this.decode24BitEeg(packet)
        this.decode24BitAccerlerometer(packet)
    }

    private decode24BitEeg(packet: Uint8Array<ArrayBufferLike>) {
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

        console.log('EEG data:', eegData)
    }

    private decode24BitAccerlerometer(packet: Uint8Array<ArrayBufferLike>) {
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

        console.log('Accelerometer data:', accelData)
    }

    private async readPacketAndEnsureAlignment() {
        const packet = await this.device.read(this.bytesPerSample)

        if (packet[0] !== 0xff) {
            const idx = packet.indexOf(0xff)
            const partial = packet.slice(idx)

            if (idx === -1) {
                console.log('Malformed packet')
                return packet
            }

            const rest = await this.device.read(idx)
            packet.set(rest, partial.length)
        }

        return packet
    }

    private handlePacketCounter(packet: Uint8Array<ArrayBufferLike>) {
        if (typeof this.packetCounter == 'undefined') {
            this.packetCounter = packet[1]
        } else {
            if (packet[1] !== this.packetCounter + 1) {
                if (packet[1] == 0) {
                    this.resetPacketCounter()
                } else {
                    this.incrementNumPacketsDropped()
                }
            }
            this.packetCounter = packet[1]
        }
    }

    private resetPacketCounter() {
        this.packetCounter = 0
    }

    private incrementNumPacketsDropped() {
        this.numPacketsDropped++
        console.log('Dropped packet')
    }

    public async stopStreaming() {
        this.finishXdfRecorderIfExists()
    }

    private finishXdfRecorderIfExists() {
        this.xdfRecorder?.finish()
    }

    public async disconnect() {
        if (this.isRunning) {
            await this.stopStreaming()
            this.isRunning = false
        }
    }

    public get outlets() {
        return [this.eegOutlet, this.accelOutlet]
    }

    public get streamQueries() {
        return CgxDeviceStreamer.streamQueries
    }

    private get numEegChannels() {
        return CgxDeviceStreamer.eegCharacteristicNames.length
    }

    private get numAccelChannels() {
        return CgxDeviceStreamer.accelCharacteristicNames.length
    }

    private get FTDI() {
        return CgxDeviceStreamer.FTDI
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
        name: 'CGX Quick-20r (Cognionics) - EEG',
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
        name: 'CGX Quick-20r (Cognionics) - Accelerometer',
        type: 'ACCEL',
        channelNames: this.accelCharacteristicNames,
        sampleRateHz: 500,
        channelFormat: 'float32' as ChannelFormat,
        manufacturer: 'CGX Systems',
        units: 'Unknown',
        chunkSize: 1,
    }

    private static createXdfRecorderIfPath(xdfRecordPath?: string) {
        return xdfRecordPath
            ? XdfStreamRecorder.Create(xdfRecordPath, this.streamQueries)
            : undefined
    }

    private static async EegOutlet() {
        return await LslStreamOutlet.Create(this.eegOptions)
    }

    private static async AccelOutlet() {
        return await LslStreamOutlet.Create(this.accelOptions)
    }
}

export interface CgxDeviceStreamerOptions {
    xdfRecordPath?: string
}

export type CgxDeviceStreamerConstructor = new (
    options: CgxDeviceStreamerConstructorOptions
) => DeviceStreamer

export interface CgxDeviceStreamerConstructorOptions {
    eegOutlet: StreamOutlet
    accelOutlet: StreamOutlet
    xdfRecorder?: XdfRecorder
    xdfRecordPath?: string
}
