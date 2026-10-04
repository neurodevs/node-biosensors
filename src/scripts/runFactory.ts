import BiosensorDeviceFactory from '../impl/BiosensorDeviceFactory.js'

const factory = BiosensorDeviceFactory.Create()

const { device, recorder } = await factory.createDevice('Muse S Gen 2', {
    xdfRecordPath: './artifacts/test.xdf',
    bleUuid: '',
})

recorder?.start()

await device.connect()
void device.startStreaming()

await new Promise((resolve) => {
    setTimeout(resolve, 10000)
})

await device.disconnect()

recorder?.finish()
