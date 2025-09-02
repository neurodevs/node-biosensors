export * from './types'

export { default as BiosensorDeviceFactory } from './modules/BiosensorDeviceFactory'
export * from './modules/BiosensorDeviceFactory'

export { default as FakeDeviceFactory } from './testDoubles/DeviceFactory/FakeDeviceFactory'
export * from './testDoubles/DeviceFactory/FakeDeviceFactory'

// Cognionics Quick-20r

export { default as CgxDeviceStreamer } from './modules/devices/CgxDeviceStreamer'
export * from './modules/devices/CgxDeviceStreamer'

export { default as SpyCgxDeviceStreamer } from './testDoubles/DeviceStreamer/CgxDeviceStreamer/SpyCgxDeviceStreamer'
export * from './testDoubles/DeviceStreamer/CgxDeviceStreamer/SpyCgxDeviceStreamer'

export { default as FakeCgxDeviceStreamer } from './testDoubles/DeviceStreamer/CgxDeviceStreamer/FakeCgxDeviceStreamer'
export * from './testDoubles/DeviceStreamer/CgxDeviceStreamer/FakeCgxDeviceStreamer'

// Muse S Gen 2

export { default as MuseDeviceStreamer } from './modules/devices/MuseDeviceStreamer'
export * from './modules/devices/MuseDeviceStreamer'

export { default as SpyMuseDeviceStreamer } from './testDoubles/DeviceStreamer/MuseDeviceStreamer/SpyMuseDeviceStreamer'
export * from './testDoubles/DeviceStreamer/MuseDeviceStreamer/SpyMuseDeviceStreamer'

export { default as FakeMuseDeviceStreamer } from './testDoubles/DeviceStreamer/MuseDeviceStreamer/FakeMuseDeviceStreamer'
export * from './testDoubles/DeviceStreamer/MuseDeviceStreamer/FakeMuseDeviceStreamer'

// Zephyr BioHarness 3

export { default as ZephyrDeviceStreamer } from './modules/devices/ZephyrDeviceStreamer'
export * from './modules/devices/ZephyrDeviceStreamer'

export { default as FakeZephyrDeviceStreamer } from './testDoubles/DeviceStreamer/ZephyrDeviceStreamer/FakeZephyrDeviceStreamer'
export * from './testDoubles/DeviceStreamer/ZephyrDeviceStreamer/FakeZephyrDeviceStreamer'
