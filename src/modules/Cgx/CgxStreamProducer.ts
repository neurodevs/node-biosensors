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

    protected constructor() {}

    public static async Create() {
        return new (this.Class ?? this)()
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
        this.validatePacket()
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

    private validatePacket() {
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

    private readonly headerByte = this.packet[0]
    private readonly counterByte = this.packet[1]

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

    private get FTDI() {
        return CgxStreamProducer.FTDI
    }
}

export type CgxStreamProducerConstructor = new () => LslProducer
