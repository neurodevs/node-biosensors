export * from './types'

// Cognionics Quick-20r

export { default as CgxDeviceStreamer } from './devices/CgxDeviceStreamer'
export * from './devices/CgxDeviceStreamer'

export { default as SpyCgxDeviceStreamer } from './testDoubles/devices/SpyCgxDeviceStreamer'
export * from './testDoubles/devices/SpyCgxDeviceStreamer'

export { default as FakeCgxDeviceStreamer } from './testDoubles/devices/FakeCgxDeviceStreamer'
export * from './testDoubles/devices/FakeCgxDeviceStreamer'

// Muse S Gen 2

export { default as MuseDeviceStreamer } from './devices/MuseDeviceStreamer'
export * from './devices/MuseDeviceStreamer'

export { default as SpyMuseDeviceStreamer } from './testDoubles/devices/SpyMuseDeviceStreamer'
export * from './testDoubles/devices/SpyMuseDeviceStreamer'

export { default as FakeMuseDeviceStreamer } from './testDoubles/devices/FakeMuseDeviceStreamer'
export * from './testDoubles/devices/FakeMuseDeviceStreamer'

// Zephyr BioHarness 3

export { default as ZephyrDeviceStreamer } from './devices/ZephyrDeviceStreamer'
export * from './devices/ZephyrDeviceStreamer'

export { default as FakeZephyrDeviceStreamer } from './testDoubles/devices/FakeZephyrDeviceStreamer'
export * from './testDoubles/devices/FakeZephyrDeviceStreamer'
