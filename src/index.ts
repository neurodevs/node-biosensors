// BiosensorDeviceFactory

export { default as BiosensorDeviceFactory } from './impl/BiosensorDeviceFactory.js'
export * from './impl/BiosensorDeviceFactory.js'

export { default as FakeDeviceFactory } from './testDoubles/DeviceFactory/FakeDeviceFactory.js'
export * from './testDoubles/DeviceFactory/FakeDeviceFactory.js'

// CytonController

export { default as CytonDeviceController } from './impl/openbci/CytonDeviceController.js'
export * from './impl/openbci/CytonDeviceController.js'

export { default as FakeCytonController } from './testDoubles/CytonController/FakeCytonController.js'
export * from './testDoubles/CytonController/FakeCytonController.js'

// MuseDetector

export { default as MuseModelDetector } from './impl/muse/MuseModelDetector.js'
export * from './impl/muse/MuseModelDetector.js'

export { default as FakeMuseDetector } from './testDoubles/MuseDetector/FakeMuseDetector.js'
export * from './testDoubles/MuseDetector/FakeMuseDetector.js'

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

export { default as FakeDeviceController } from './testDoubles/MuseController/FakeMuseController.js'
export * from './testDoubles/MuseController/FakeMuseController.js'

// Cognionics Quick-20r

export { default as CgxDeviceController } from './impl/cognionics/CgxDeviceController.js'
export * from './impl/cognionics/CgxDeviceController.js'

export { default as FakeCgxDeviceController } from './testDoubles/CgxController/FakeCgxController.js'
export * from './testDoubles/CgxController/FakeCgxController.js'

export { default as SpyCgxController } from './testDoubles/CgxController/SpyCgxController.js'
export * from './testDoubles/CgxController/SpyCgxController.js'

// Muse Headsets (supports Muse 2, Muse S Athena, and Muse S Gen 2)

export { default as MuseDeviceController } from './impl/muse/MuseDeviceController.js'
export * from './impl/muse/MuseDeviceController.js'

export { default as FakeMuseController } from './testDoubles/MuseController/FakeMuseController.js'
export * from './testDoubles/MuseController/FakeMuseController.js'

export { default as SpyMuseController } from './testDoubles/MuseController/SpyMuseController.js'
export * from './testDoubles/MuseController/SpyMuseController.js'

// Zephyr BioHarness 3.0

export { default as ZephyrDeviceController } from './impl/zephyr/ZephyrDeviceController.js'
export * from './impl/zephyr/ZephyrDeviceController.js'

export { default as FakeZephyrController } from './testDoubles/ZephyrController/FakeZephyrController.js'
export * from './testDoubles/ZephyrController/FakeZephyrController.js'

export { default as SpyZephyrController } from './testDoubles/ZephyrController/SpyZephyrController.js'
export * from './testDoubles/ZephyrController/SpyZephyrController.js'
