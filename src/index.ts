// Generic types
export * from './types'

// CGX Cognionics Quick-20r

export { default as CgxDeviceStreamer } from './modules/CgxDeviceStreamer'
export * from './modules/CgxDeviceStreamer'

// Muse S Gen 2

// BLE -> LSL + XDF
export { default as RecordableDeviceAdapter } from './modules/RecordableDeviceAdapter'
export * from './modules/RecordableDeviceAdapter'

// BLE -> LSL
export { default as MuseDeviceStreamer } from './modules/MuseDeviceStreamer'
export * from './modules/MuseDeviceStreamer'

// Test doubles

export { default as FakeMuseAdapter } from './testDoubles/FakeDeviceAdapter'
export * from './testDoubles/FakeDeviceAdapter'

export { default as FakeMuseDeviceStreamer } from './testDoubles/FakeMuseDeviceStreamer'
export * from './testDoubles/FakeMuseDeviceStreamer'

export { default as FakeCgxDeviceStreamer } from './testDoubles/FakeCgxDeviceStreamer'
export * from './testDoubles/FakeCgxDeviceStreamer'

export { default as SpyMuseDeviceStreamer } from './testDoubles/SpyMuseDeviceStreamer'
export * from './testDoubles/SpyMuseDeviceStreamer'

export { default as SpyCgxDeviceStreamer } from './testDoubles/SpyCgxDeviceStreamer'
export * from './testDoubles/SpyCgxDeviceStreamer'
