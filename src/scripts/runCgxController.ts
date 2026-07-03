import CgxDeviceController from '../impl/cognionics/CgxDeviceController.js'

const cgx = await CgxDeviceController.Create()
await cgx.startStreaming()
