// CGX Cognionics Quick-20r

export { default as CgxQuick20Adapter } from './components/CgxQuick20/CgxQuick20Adapter'
export * from './components/CgxQuick20/CgxQuick20Adapter'

// Muse S Gen 2

// BLE -> LSL + XDF
export { default as MuseDeviceAdapter } from './components/MuseSGen2/MuseDeviceAdapter'
export * from './components/MuseSGen2/MuseDeviceAdapter'

// BLE -> LSL
export { default as MuseStreamProducer } from './components/MuseSGen2/MuseStreamProducer'
export * from './components/MuseSGen2/MuseStreamProducer'

// LSL -> XDF
export { default as MuseStreamRecorder } from './components/MuseSGen2/MuseStreamRecorder'
export * from './components/MuseSGen2/MuseStreamRecorder'

// Test doubles

export { default as FakeMuseProducer } from './testDoubles/MuseProducer/FakeMuseProducer'
export * from './testDoubles/MuseProducer/FakeMuseProducer'

export { default as FakeMuseRecorder } from './testDoubles/MuseRecorder/FakeMuseRecorder'
export * from './testDoubles/MuseRecorder/FakeMuseRecorder'

export { default as SpyMuseProducer } from './testDoubles/MuseProducer/SpyMuseProducer'
export * from './testDoubles/MuseProducer/SpyMuseProducer'
