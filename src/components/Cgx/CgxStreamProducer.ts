import FTDI from 'ftdi-d2xx'
import SpruceError from '../../errors/SpruceError'
import { LslProducer } from '../../types'

export default class CgxStreamProducer implements LslProducer {
    public static Class?: CgxStreamProducerConstructor
    public static FTDI = FTDI

    public isRunning = false
    public bleUuid = ''
    public bleName = ''

    protected constructor() {}

    public static async Create() {
        const infos = await this.FTDI.getDeviceInfoList()

        if (infos.length === 0) {
            throw new SpruceError({ code: 'CGX_FTDI_DEVICE_NOT_FOUND' })
        }

        const serialNumber = infos[0].serial_number
        const device = await this.FTDI.openDevice(serialNumber)

        device.setTimeouts(1000, 1000)
        device.purge(FTDI.FT_PURGE_RX)
        device.setFlowControl(FTDI.FT_FLOW_RTS_CTS, 0x11, 0x13)
        device.setBaudRate(1000000)

        device.setDataCharacteristics(
            FTDI.FT_BITS_8,
            FTDI.FT_STOP_BITS_1,
            FTDI.FT_PARITY_NONE
        )

        device.setLatencyTimer(4)

        return new (this.Class ?? this)()
    }

    public async startLslStreams() {}

    public async stopLslStreams() {}

    public async disconnect() {}
}

export type CgxStreamProducerConstructor = new () => LslProducer
