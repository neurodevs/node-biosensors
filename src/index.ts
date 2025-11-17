// BiosensorArrayMonitor

export { default as BiosensorArrayMonitor } from './impl/BiosensorArrayMonitor.js'
export * from './impl/BiosensorArrayMonitor.js'

export { default as FakeArrayMonitor } from './testDoubles/ArrayMonitor/FakeArrayMonitor.js'
export * from './testDoubles/ArrayMonitor/FakeArrayMonitor.js'

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

// JitterGrapher

export { default as TimestampJitterGrapher } from './impl/TimestampJitterGrapher.js'
export * from './impl/TimestampJitterGrapher.js'

export { default as FakeJitterGrapher } from './testDoubles/JitterGrapher/FakeJitterGrapher.js'
export * from './testDoubles/JitterGrapher/FakeJitterGrapher.js'

// Muse S Gen 2

export { default as MuseDeviceStreamer } from './impl/devices/MuseDeviceStreamer.js'
export * from './impl/devices/MuseDeviceStreamer.js'

export { default as SpyMuseDeviceStreamer } from './testDoubles/DeviceStreamer/MuseDeviceStreamer/SpyMuseDeviceStreamer.js'
export * from './testDoubles/DeviceStreamer/MuseDeviceStreamer/SpyMuseDeviceStreamer.js'

export { default as FakeMuseDeviceStreamer } from './testDoubles/DeviceStreamer/MuseDeviceStreamer/FakeMuseDeviceStreamer.js'
export * from './testDoubles/DeviceStreamer/MuseDeviceStreamer/FakeMuseDeviceStreamer.js'

// Zephyr BioHarness 3

export { default as ZephyrDeviceStreamer } from './impl/devices/ZephyrDeviceStreamer.js'
export * from './impl/devices/ZephyrDeviceStreamer.js'

export { default as FakeZephyrDeviceStreamer } from './testDoubles/DeviceStreamer/ZephyrDeviceStreamer/FakeZephyrDeviceStreamer.js'
export * from './testDoubles/DeviceStreamer/ZephyrDeviceStreamer/FakeZephyrDeviceStreamer.js'
