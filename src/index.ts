// Generic types
export * from './types'

// CGX Cognionics Quick-20r

export { default as CgxStreamProducer } from './modules/Cgx/CgxStreamProducer'
export * from './modules/Cgx/CgxStreamProducer'

// Muse S Gen 2

// BLE -> LSL + XDF
export { default as MuseDeviceAdapter } from './modules/Muse/MuseDeviceAdapter'
export * from './modules/Muse/MuseDeviceAdapter'

// BLE -> LSL
export { default as MuseStreamProducer } from './modules/Muse/MuseStreamProducer'
export * from './modules/Muse/MuseStreamProducer'

// Test doubles

export { default as FakeMuseAdapter } from './testDoubles/MuseAdapter/FakeMuseAdapter'
export * from './testDoubles/MuseAdapter/FakeMuseAdapter'

export { default as FakeMuseProducer } from './testDoubles/MuseProducer/FakeMuseProducer'
export * from './testDoubles/MuseProducer/FakeMuseProducer'

export { default as SpyMuseProducer } from './testDoubles/MuseProducer/SpyMuseProducer'
export * from './testDoubles/MuseProducer/SpyMuseProducer'

export { default as SpyCgxProducer } from './testDoubles/CgxProducer/SpyCgxProducer'
export * from './testDoubles/CgxProducer/SpyCgxProducer'
