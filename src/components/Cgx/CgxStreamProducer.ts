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
        await this.FTDI.openDevice(serialNumber)

        return new (this.Class ?? this)()
    }

    public async startLslStreams() {}

    public async stopLslStreams() {}
}

export type CgxStreamProducerConstructor = new () => LslProducer
