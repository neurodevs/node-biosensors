import { TimestampJitterGrapher } from '@neurodevs/node-biosignal-processing'
import { XdfStreamRecorder } from '@neurodevs/node-xdf'

import MuseDeviceController from '../impl/muse/MuseDeviceController.js'

const xdfRecordPath = './artifacts/muse_data.xdf'

const recorder = await XdfStreamRecorder.Create(xdfRecordPath, [
    'type="EEG"',
    'type="PPG"',
    'type="ACCEL"',
    'type="GYRO"',
    'type="IMU"',
])

recorder.start()

const muse = await MuseDeviceController.Create({
    bleUuid: 'CA6A61B7-B7A8-AF24-3C9E-04A6A5012554',
    model: 'Muse S Gen 2',
    rssiIntervalMs: undefined,
    xdfRecordPath: undefined,
    txtRecordPath: undefined,
    enableLogs: false,
    disableEeg: false,
    disablePpg: false,
    disableAccel: false,
    disableGyro: false,
})

await muse.connect()
await muse.startStreaming()

const muse2 = await MuseDeviceController.Create({
    bleUuid: 'F57439F1-3287-71B4-2251-F15797949214',
    model: 'Muse S Athena',
    rssiIntervalMs: undefined,
    xdfRecordPath: undefined,
    txtRecordPath: undefined,
    enableLogs: false,
    disableEeg: false,
    disablePpg: false,
    disableAccel: false,
    disableGyro: false,
})

await muse2.connect()
await muse2.startStreaming()

const muse3 = await MuseDeviceController.Create({
    bleUuid: 'F868B42C-FA67-F9CA-BC95-76269D21C38F',
    model: 'Muse 2',
    rssiIntervalMs: undefined,
    xdfRecordPath: undefined,
    txtRecordPath: undefined,
    enableLogs: false,
    disableEeg: false,
    disablePpg: false,
    disableAccel: false,
    disableGyro: false,
})

await muse3.connect()
await muse3.startStreaming()

console.info('Streaming for 10 seconds...')

await new Promise((resolve) => setTimeout(resolve, 10000))

console.info('Disconnecting first...')
await muse.disconnect()
console.info('Disconnecting second...')
await muse2.disconnect()
console.info('Disconnecting third...')
await muse3.disconnect()

console.info('Finishing XDF recorder...')
recorder.finish()

await new Promise((resolve) => setTimeout(resolve, 5000))

const grapher = await TimestampJitterGrapher.Create(
    xdfRecordPath,
    './artifacts',
    {
        totalSecs: 1,
        ignoreInterpolatedTimestamps: false,
        showIdealIntervalMs: true,
        xAxisUnits: 'milliseconds',
    }
)
await grapher.run()

console.info('Done!\n')
