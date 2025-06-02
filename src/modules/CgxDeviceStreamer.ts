// Byte definitions
// 0: Packet header (value: 255)
// 1: Packet counter (values: 0-127)
// 2–64: EEG data (21 channels, 3 bytes each, values: 0–254)
// 65–73: Accelerometer data (3 channels, 3 bytes each, values: 0–254)
// 74: Impedance check (0x11 [ie. 17] ON, 0x12 [ie. 18] OFF)
// 75: Battery voltage (value: 0–255)
// 76-77: Trigger (value: 0–255)

import { ChannelFormat, LslOutlet, LslStreamOutlet } from '@neurodevs/node-lsl'
import FTDI from 'ftdi-d2xx'
import SpruceError from '../errors/SpruceError'
import { DeviceStreamer } from '../types'

export default class CgxDeviceStreamer implements DeviceStreamer {
    public static Class?: CgxDeviceStreamerConstructor
    public static FTDI = FTDI

    public isRunning = false
    protected numPacketsDropped = 0
    private infos!: FTDI.FTDI_DeviceInfo[]
    private device!: FTDI.FTDI_Device
    private packet!: Uint8Array<ArrayBufferLike>
    private packetCounter!: number
    private eegOutlet: LslOutlet
    private accelOutlet: LslOutlet

    protected constructor(eegOutlet: LslOutlet, accelOutlet: LslOutlet) {
        this.eegOutlet = eegOutlet
        this.accelOutlet = accelOutlet
    }

    public static async Create() {
        const eegOutlet = await LslStreamOutlet.Create(this.eegOptions)
        const accelOutlet = await LslStreamOutlet.Create(this.accelOptions)

        return new (this.Class ?? this)(eegOutlet, accelOutlet)
    }

    public async startStreaming() {
        await this.connectFtdi()
        await this.startReadingPackets()
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
            throw new SpruceError({ code: 'CGX_FTDI_DEVICE_NOT_FOUND' })
        }
    }

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
        this.isRunning = true

        while (this.isRunning) {
            try {
                await this.readPacket()
            } catch {
                return
            }
        }
    }

    private async readPacket() {
        this.packet = await this.readPacketFromDevice()
        await this.offsetIfHeaderNotFirst()
        this.handlePacketCounter()

        this.decode24BitEeg()
        this.decode24BitAccerlerometer()
    }

    private decode24BitEeg() {
        const eegData = []

        for (let i = 0; i < this.numEegChannels; i++) {
            const startIdx = 2 + i * 3
            const firstByte = this.packet[startIdx]
            const secondByte = this.packet[startIdx + 1]
            const thirdByte = this.packet[startIdx + 2]

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

    private decode24BitAccerlerometer() {
        const accelData = []

        for (let i = 0; i < this.numAccelChannels; i++) {
            const startIdx = 65 + i * 3
            const firstByte = this.packet[startIdx]
            const secondByte = this.packet[startIdx + 1]
            const thirdByte = this.packet[startIdx + 2]

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

    private async readPacketFromDevice() {
        return await this.device.read(this.bytesPerSample)
    }

    private async offsetIfHeaderNotFirst() {
        if (this.headerByte !== 0xff) {
            const idx = this.packet.indexOf(0xff)
            const partial = this.packet.slice(idx)
            const rest = await this.device.read(idx)

            this.packet.set(rest, partial.length)
        }
    }

    private handlePacketCounter() {
        if (typeof this.packetCounter == 'undefined') {
            this.setPacketCounterToCurrent()
        } else {
            if (this.counterByte !== this.packetCounter + 1) {
                if (this.counterByte == 0) {
                    this.resetPacketCounter()
                } else {
                    this.incrementNumPacketsDropped()
                }
            }
            this.setPacketCounterToCurrent()
        }
    }

    private setPacketCounterToCurrent() {
        this.packetCounter = this.counterByte
    }

    private resetPacketCounter() {
        this.packetCounter = 0
    }

    private incrementNumPacketsDropped() {
        this.numPacketsDropped++
        console.log('Dropped packet')
    }

    public async stopStreaming() {}

    public async disconnect() {}

    public readonly streamQueries = ['type="EEG"', 'type="ACCEL"']

    private get headerByte() {
        return this.packet[0]
    }

    private get counterByte() {
        return this.packet[1]
    }

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
        sampleRate: 500,
        channelFormat: 'float32' as ChannelFormat,
        manufacturer: 'CGX Systems',
        unit: 'microvolt',
        chunkSize: 1,
        maxBuffered: 360,
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
        sampleRate: 500,
        channelFormat: 'float32' as ChannelFormat,
        manufacturer: 'CGX Systems',
        unit: 'Unknown',
        chunkSize: 1,
        maxBuffered: 360,
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
}

export type CgxDeviceStreamerConstructor = new (
    eegOutlet: LslOutlet,
    accelOutlet: LslOutlet
) => DeviceStreamer
