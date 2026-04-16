import MuseDeviceStreamer from '../impl/devices/MuseDeviceStreamer.js'

const muse = await MuseDeviceStreamer.Create()
await muse.startStreaming()
console.log(muse.bleUuid)
