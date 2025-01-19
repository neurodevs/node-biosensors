import FTDI from 'ftdi-d2xx'
import SpruceError from '../../errors/SpruceError'
import { LslProducer } from '../../types'

export default class CgxStreamProducer implements LslProducer {
    public static Class?: CgxStreamProducerConstructor
    public static FTDI = FTDI

    public isRunning = false
    private device!: FTDI.FTDI_Device

    protected constructor() {}

    public static async Create() {
        return new (this.Class ?? this)()
    }

    public async startLslStreams() {
        await this.connectFtdi()
    }

    private async connectFtdi() {
        const infos = await this.FTDI.getDeviceInfoList()

        if (infos.length === 0) {
            throw new SpruceError({ code: 'CGX_FTDI_DEVICE_NOT_FOUND' })
        }

        const serialNumber = infos[0].serial_number
        this.device = await this.FTDI.openDevice(serialNumber)

        this.device.setTimeouts(1000, 1000)
        this.device.purge(FTDI.FT_PURGE_RX)
        this.device.setFlowControl(FTDI.FT_FLOW_RTS_CTS, 0x11, 0x13)
        this.device.setBaudRate(1000000)

        this.device.setDataCharacteristics(
            FTDI.FT_BITS_8,
            FTDI.FT_STOP_BITS_1,
            FTDI.FT_PARITY_NONE
        )

        this.device.setLatencyTimer(4)
    }

    public async stopLslStreams() {}

    public async disconnect() {}

    private get FTDI() {
        return CgxStreamProducer.FTDI
    }
}

export type CgxStreamProducerConstructor = new () => LslProducer
