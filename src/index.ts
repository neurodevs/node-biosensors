// CGX Cognionics Quick-20r

export { default as CgxDeviceAdapter } from './components/CgxDeviceAdapter'
export * from './components/CgxDeviceAdapter'

// Muse S Gen 2

// BLE -> LSL + XDF
export { default as MuseDeviceAdapter } from './components/MuseDeviceAdapter'
export * from './components/MuseDeviceAdapter'

// BLE -> LSL
export { default as MuseStreamProducer } from './components/MuseStreamProducer'
export * from './components/MuseStreamProducer'

// LSL -> XDF
export { default as MuseStreamRecorder } from './components/MuseStreamRecorder'
export * from './components/MuseStreamRecorder'

// Test doubles

export { default as FakeMuseAdapter } from './testDoubles/MuseAdapter/FakeMuseAdapter'
export * from './testDoubles/MuseAdapter/FakeMuseAdapter'

export { default as FakeMuseProducer } from './testDoubles/MuseProducer/FakeMuseProducer'
export * from './testDoubles/MuseProducer/FakeMuseProducer'

export { default as FakeMuseRecorder } from './testDoubles/MuseRecorder/FakeMuseRecorder'
export * from './testDoubles/MuseRecorder/FakeMuseRecorder'

export { default as SpyMuseProducer } from './testDoubles/MuseProducer/SpyMuseProducer'
export * from './testDoubles/MuseProducer/SpyMuseProducer'
