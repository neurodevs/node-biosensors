// BiosensorDeviceFactory

export { default as BiosensorDeviceFactory } from './impl/BiosensorDeviceFactory.js'
export * from './impl/BiosensorDeviceFactory.js'

export { default as FakeDeviceFactory } from './testDoubles/DeviceFactory/FakeDeviceFactory.js'
export * from './testDoubles/DeviceFactory/FakeDeviceFactory.js'

// StreamingOrchestrator

export { default as BiosensorStreamingOrchestrator } from './impl/BiosensorStreamingOrchestrator.js'
export * from './impl/BiosensorStreamingOrchestrator.js'

export { default as FakeStreamingOrchestrator } from './testDoubles/StreamingOrchestrator/FakeStreamingOrchestrator.js'
export * from './testDoubles/StreamingOrchestrator/FakeStreamingOrchestrator.js'

// WebSocketGateway

export { default as BiosensorWebSocketGateway } from './impl/BiosensorWebSocketGateway.js'
export * from './impl/BiosensorWebSocketGateway.js'

export { default as FakeWebSocketGateway } from './testDoubles/WebSocketGateway/FakeWebSocketGateway.js'
export * from './testDoubles/WebSocketGateway/FakeWebSocketGateway.js'

// --- BIOSENSOR DEVICE CONTROLLERS -----------------------------------------------------------------

// DeviceController

export { default as FakeDeviceController } from './testDoubles/devices/MuseController/FakeMuseController.js'
export * from './testDoubles/devices/MuseController/FakeMuseController.js'

// Cognionics Quick-20r

export { default as CgxDeviceController } from './impl/devices/CgxDeviceController.js'
export * from './impl/devices/CgxDeviceController.js'

export { default as SpyCgxController } from './testDoubles/devices/CgxController/SpyCgxController.js'
export * from './testDoubles/devices/CgxController/SpyCgxController.js'

export { default as FakeCgxDeviceController } from './testDoubles/devices/CgxController/FakeCgxController.js'
export * from './testDoubles/devices/CgxController/FakeCgxController.js'

// Muse S Gen 2

export { default as MuseDeviceController } from './impl/devices/MuseDeviceController.js'
export * from './impl/devices/MuseDeviceController.js'

// Zephyr BioHarness 3

export { default as ZephyrDeviceController } from './impl/devices/ZephyrDeviceController.js'
export * from './impl/devices/ZephyrDeviceController.js'

export { default as FakeZephyrController } from './testDoubles/devices/ZephyrController/FakeZephyrController.js'
export * from './testDoubles/devices/ZephyrController/FakeZephyrController.js'
