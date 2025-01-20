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
                const packet = await this.device.read(this.bytesPerSample)
                await this.offsetIfHeaderNotFirst(packet)
                this.validatePacket(packet)
            } catch {
                return
            }
        }
    }

    private async offsetIfHeaderNotFirst(packet: Uint8Array<ArrayBufferLike>) {
        if (packet[0] !== 0xff) {
            const idx = packet.indexOf(0xff)
            const partial = packet.slice(idx)
            const rest = await this.device.read(idx)
            packet.set(rest, partial.length)
        }
    }

    private validatePacket(packet: Uint8Array<ArrayBufferLike>) {
        if (typeof this.packetCounter == 'undefined') {
            this.packetCounter = packet[1]
        } else {
            if (packet[1] !== this.packetCounter + 1) {
                this.numPacketsDropped++
                console.log('Dropped packet')
            }
            this.packetCounter = packet[1]
        }
    }

    public async stopLslStreams() {}

    public async disconnect() {}

    private readonly readTimeoutMs = 1000
    private readonly writeTimeoutMs = 1000
    private readonly ftdiReadBuffer = FTDI.FT_PURGE_RX
    private readonly ftdiFlowControlMode = FTDI.FT_FLOW_RTS_CTS
    private readonly seventeenInHex = 0x11
    private readonly nineteenInHex = 0x13
    private readonly baudRate = 1000000
    private readonly eightDataBits = FTDI.FT_BITS_8
    private readonly oneStopBit = FTDI.FT_STOP_BITS_1
    private readonly noParityBit = FTDI.FT_PARITY_NONE
    private readonly latencyTimerMs = 4
    private readonly bytesPerSample = 78

    private get FTDI() {
        return CgxStreamProducer.FTDI
    }
}

export type CgxStreamProducerConstructor = new () => LslProducer
