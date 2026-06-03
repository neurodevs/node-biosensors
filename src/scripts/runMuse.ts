import MuseDeviceController from '../impl/MuseDeviceController.js'

const muse = await MuseDeviceController.Create({
    bleUuid: 'CA6A61B7-B7A8-AF24-3C9E-04A6A5012554',
})

await muse.startStreaming()

await new Promise((resolve) => setTimeout(resolve, 5000))

await muse.stopStreaming()

await new Promise((resolve) => setTimeout(resolve, 2000))

await muse.disconnect()

console.log('Done!')
