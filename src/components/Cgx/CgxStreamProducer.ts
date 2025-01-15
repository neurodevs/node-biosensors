import FTDI from 'ftdi-d2xx'
import { LslProducer } from '../../types'

export default class CgxStreamProducer implements LslProducer {
    public static Class?: CgxStreamProducerConstructor
    public static FTDI = FTDI

    public isRunning = false
    public bleUuid = ''
    public bleName = ''

    protected constructor() {}

    public static async Create() {
        await this.FTDI.getDeviceInfoList()
        return new (this.Class ?? this)()
    }

    public async startLslStreams() {}

    public async stopLslStreams() {}
}

export type CgxStreamProducerConstructor = new () => LslProducer
