// Byte definitions
// 0: Packet header (value: 255)
// 1: Packet counter (values: 0-127)
// 2–61: EEG data (20 channels, 3 bytes each, values: 0–254)
// 61–69: Accelerometer data (3 channels, 3 bytes each, values: 0–254)
// 70: Impedance (value: 0–255)
// 71: Battery voltage (value: 0–255)
// 72-73: Trigger (value: 0–255)
// 74: Packet footer (value: 255)
// 75: Reserved / unknown
// 76: Reserved / unknown
// 77: Reserved / unknown

import { ChannelFormat, LslOutlet, LslStreamOutlet } from '@neurodevs/node-lsl'
import FTDI from 'ftdi-d2xx'
import SpruceError from '../../errors/SpruceError'
import { LslProducer } from '../../types'

export default class CgxStreamProducer implements LslProducer {
    public static Class?: CgxStreamProducerConstructor
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

    public async startLslStreams() {
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

        this.processEegData()
        this.processAccelerometerData()
    }

    private processEegData() {
        const eegData = []

        for (let i = 0; i < 20; i++) {
            const firstByte = this.packet[2 + i * 3]
            const secondByte = this.packet[3 + i * 3]
            const thirdByte = this.packet[4 + i * 3]

            const rawValue =
                (firstByte << 24) | (secondByte << 17) | (thirdByte << 10)

            const volts = rawValue * (5.0 / 3.0) * (1.0 / Math.pow(2, 32))
            eegData.push(volts)
        }

        this.eegOutlet.pushSample(eegData)
    }

    private processAccelerometerData() {
        const accelData = []

        for (let i = 0; i < 3; i++) {
            const firstByte = this.packet[62 + i * 3]
            const secondByte = this.packet[63 + i * 3]
            const thirdByte = this.packet[64 + i * 3]

            const rawValue =
                (firstByte << 24) | (secondByte << 17) | (thirdByte << 10)

            const volts = rawValue * 2.5 * (1.0 / Math.pow(2, 32))
            accelData.push(volts)
        }

        this.accelOutlet.pushSample(accelData)
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

    public async stopLslStreams() {}

    public async disconnect() {}

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
        'ExG1',
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

    private static readonly accelOptions = {
        sourceId: 'cgx-accel',
        name: 'CGX Quick-20r (Cognionics) - Accelerometer',
        type: 'ACCEL',
        channelNames: ['X_ACCEL', 'Y_ACCEL', 'Z_ACCEL'],
        sampleRate: 500,
        channelFormat: 'float32' as ChannelFormat,
        manufacturer: 'CGX Systems',
        unit: 'Unknown',
        chunkSize: 1,
        maxBuffered: 360,
    }

    private get FTDI() {
        return CgxStreamProducer.FTDI
    }
}

export type CgxStreamProducerConstructor = new (
    eegOutlet: LslOutlet,
    accelOutlet: LslOutlet
) => LslProducer
