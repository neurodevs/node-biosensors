export * from './types'

// Devices

// Cognionics Quick-20r

export { default as CgxDeviceStreamer } from './devices/CgxDeviceStreamer'
export * from './devices/CgxDeviceStreamer'

export { default as SpyCgxDeviceStreamer } from './testDoubles/SpyCgxDeviceStreamer'
export * from './testDoubles/SpyCgxDeviceStreamer'

export { default as FakeCgxDeviceStreamer } from './testDoubles/FakeCgxDeviceStreamer'
export * from './testDoubles/FakeCgxDeviceStreamer'

// Muse S Gen 2

export { default as MuseDeviceStreamer } from './devices/MuseDeviceStreamer'
export * from './devices/MuseDeviceStreamer'

export { default as SpyMuseDeviceStreamer } from './testDoubles/SpyMuseDeviceStreamer'
export * from './testDoubles/SpyMuseDeviceStreamer'

export { default as FakeMuseDeviceStreamer } from './testDoubles/FakeMuseDeviceStreamer'
export * from './testDoubles/FakeMuseDeviceStreamer'

// Zephyr BioHarness 3

export { default as ZephyrDeviceStreamer } from './devices/ZephyrDeviceStreamer'
export * from './devices/ZephyrDeviceStreamer'

export { default as FakeZephyrDeviceStreamer } from './testDoubles/FakeZephyrDeviceStreamer'
export * from './testDoubles/FakeZephyrDeviceStreamer'

// Modules

export { default as FakeMuseAdapter } from './testDoubles/FakeDeviceAdapter'
export * from './testDoubles/FakeDeviceAdapter'

export { default as RecordableDeviceAdapter } from './modules/RecordableDeviceAdapter'
export * from './modules/RecordableDeviceAdapter'
