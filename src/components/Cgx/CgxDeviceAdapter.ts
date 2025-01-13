import { DeviceAdapter, DeviceAdapterConstructor } from '../../types'

export default class CgxDeviceAdapter implements DeviceAdapter {
    public static Class?: DeviceAdapterConstructor

    public isRunning = false
    public bleUuid = ''
    public bleName = ''

    protected constructor() {}

    public static async Create() {
        return new (this.Class ?? this)()
    }

    public async startStreaming() {}
    public async stopStreaming() {}
    public async disconnect() {}
}
