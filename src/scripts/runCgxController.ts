import CgxDeviceController from '../impl/devices/CgxDeviceController.js'

const cgx = await CgxDeviceController.Create()
await cgx.startStreaming()
