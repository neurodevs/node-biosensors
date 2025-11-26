// BiosensorDeviceFactory

export { default as BiosensorDeviceFactory } from './impl/BiosensorDeviceFactory.js'
export * from './impl/BiosensorDeviceFactory.js'

export { default as FakeDeviceFactory } from './testDoubles/DeviceFactory/FakeDeviceFactory.js'
export * from './testDoubles/DeviceFactory/FakeDeviceFactory.js'

// Cognionics Quick-20r

export { default as CgxDeviceStreamer } from './impl/devices/CgxDeviceStreamer.js'
export * from './impl/devices/CgxDeviceStreamer.js'

export { default as SpyCgxDeviceStreamer } from './testDoubles/DeviceStreamer/CgxDeviceStreamer/SpyCgxDeviceStreamer.js'
export * from './testDoubles/DeviceStreamer/CgxDeviceStreamer/SpyCgxDeviceStreamer.js'

export { default as FakeCgxDeviceStreamer } from './testDoubles/DeviceStreamer/CgxDeviceStreamer/FakeCgxDeviceStreamer.js'
export * from './testDoubles/DeviceStreamer/CgxDeviceStreamer/FakeCgxDeviceStreamer.js'

// Muse S Gen 2

export { default as MuseDeviceStreamer } from './impl/devices/MuseDeviceStreamer.js'
export * from './impl/devices/MuseDeviceStreamer.js'

export { default as SpyMuseDeviceStreamer } from './testDoubles/DeviceStreamer/MuseDeviceStreamer/SpyMuseDeviceStreamer.js'
export * from './testDoubles/DeviceStreamer/MuseDeviceStreamer/SpyMuseDeviceStreamer.js'

export { default as FakeMuseDeviceStreamer } from './testDoubles/DeviceStreamer/MuseDeviceStreamer/FakeMuseDeviceStreamer.js'
export * from './testDoubles/DeviceStreamer/MuseDeviceStreamer/FakeMuseDeviceStreamer.js'

// RuntimeOrchestrator

export { default as BiosensorRuntimeOrchestrator } from './impl/BiosensorRuntimeOrchestrator.js'
export * from './impl/BiosensorRuntimeOrchestrator.js'

export { default as FakeRuntimeOrchestrator } from './testDoubles/RuntimeOrchestrator/FakeRuntimeOrchestrator.js'
export * from './testDoubles/RuntimeOrchestrator/FakeRuntimeOrchestrator.js'

// Zephyr BioHarness 3

export { default as ZephyrDeviceStreamer } from './impl/devices/ZephyrDeviceStreamer.js'
export * from './impl/devices/ZephyrDeviceStreamer.js'

export { default as FakeZephyrDeviceStreamer } from './testDoubles/DeviceStreamer/ZephyrDeviceStreamer/FakeZephyrDeviceStreamer.js'
export * from './testDoubles/DeviceStreamer/ZephyrDeviceStreamer/FakeZephyrDeviceStreamer.js'

// WebSocketGateway

export { default as BiosensorWebSocketGateway } from './impl/BiosensorWebSocketGateway.js'
export * from './impl/BiosensorWebSocketGateway.js'

export { default as FakeWebSocketGateway } from './testDoubles/WebSocketGateway/FakeWebSocketGateway.js'
export * from './testDoubles/WebSocketGateway/FakeWebSocketGateway.js'
