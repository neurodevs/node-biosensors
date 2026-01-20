import BiosensorDeviceFactory from '../impl/BiosensorDeviceFactory.js'

const factory = BiosensorDeviceFactory.Create()

const { device, recorder } = await factory.createDevice('Muse S Gen 2', {
    xdfRecordPath: 'test.xdf',
})

recorder?.start()

void device.startStreaming()

await new Promise((resolve) => {
    setTimeout(resolve, 10000)
})

await device.disconnect()

recorder?.finish()
