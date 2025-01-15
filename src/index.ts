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

// LSL -> XDF
export { default as MuseStreamRecorder } from './components/Muse/MuseStreamRecorder'
export * from './components/Muse/MuseStreamRecorder'

// Test doubles

export { default as FakeMuseAdapter } from './testDoubles/MuseAdapter/FakeMuseAdapter'
export * from './testDoubles/MuseAdapter/FakeMuseAdapter'

export { default as FakeMuseProducer } from './testDoubles/MuseProducer/FakeMuseProducer'
export * from './testDoubles/MuseProducer/FakeMuseProducer'

export { default as FakeMuseRecorder } from './testDoubles/MuseRecorder/FakeMuseRecorder'
export * from './testDoubles/MuseRecorder/FakeMuseRecorder'

export { default as SpyMuseProducer } from './testDoubles/MuseProducer/SpyMuseProducer'
export * from './testDoubles/MuseProducer/SpyMuseProducer'
