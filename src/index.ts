// Generic types
export * from './types'

// CGX Cognionics Quick-20r

export { default as CgxStreamProducer } from './components/Cgx/CgxStreamProducer'
export * from './components/Cgx/CgxStreamProducer'

// Muse S Gen 2

// BLE -> LSL + XDF
export { default as MuseDeviceAdapter } from './components/Muse/MuseDeviceAdapter'
export * from './components/Muse/MuseDeviceAdapter'

// BLE -> LSL
export { default as MuseStreamProducer } from './components/Muse/MuseStreamProducer'
export * from './components/Muse/MuseStreamProducer'

// Test doubles

export { default as FakeMuseAdapter } from './testDoubles/MuseAdapter/FakeMuseAdapter'
export * from './testDoubles/MuseAdapter/FakeMuseAdapter'

export { default as FakeMuseProducer } from './testDoubles/MuseProducer/FakeMuseProducer'
export * from './testDoubles/MuseProducer/FakeMuseProducer'

export { default as SpyMuseProducer } from './testDoubles/MuseProducer/SpyMuseProducer'
export * from './testDoubles/MuseProducer/SpyMuseProducer'

export { default as SpyCgxProducer } from './testDoubles/CgxProducer/SpyCgxProducer'
export * from './testDoubles/CgxProducer/SpyCgxProducer'
