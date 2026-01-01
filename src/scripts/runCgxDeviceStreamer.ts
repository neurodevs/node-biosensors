import CgxDeviceStreamer from '../impl/devices/CgxDeviceStreamer.js'

const streamer = await CgxDeviceStreamer.Create()
await streamer.startStreaming()
