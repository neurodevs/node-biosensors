import MuseDeviceController from '../impl/devices/MuseDeviceController.js'

const muse = await MuseDeviceController.Create({
    bleUuid: 'CA6A61B7-B7A8-AF24-3C9E-04A6A5012554',
    rssiIntervalMs: 1000,
    xdfRecordPath: './artifacts/muse_data.xdf',
    txtRecordPath: './artifacts/muse_data.txt',
    enableLogs: false,
    disableEeg: false,
    disablePpg: false,
    disableAccel: false,
    disableGyro: false,
})

await muse.connect()
await muse.startStreaming()

await new Promise((resolve) => setTimeout(resolve, 200000))

await muse.stopStreaming()

await new Promise((resolve) => setTimeout(resolve, 2000))

await muse.startStreaming()

await new Promise((resolve) => setTimeout(resolve, 2000))

await muse.stopStreaming()
await muse.disconnect()

await muse.connect()
await muse.startStreaming()

await new Promise((resolve) => setTimeout(resolve, 2000))

await muse.stopStreaming()
await muse.disconnect()

console.log('Done!')
