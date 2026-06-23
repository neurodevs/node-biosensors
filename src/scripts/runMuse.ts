import { TimestampJitterGrapher } from '@neurodevs/node-biosignal-processing'

import MuseDeviceController from '../impl/devices/MuseDeviceController.js'

const xdfRecordPath = './artifacts/muse_data.xdf'

const muse = await MuseDeviceController.Create('Muse S Athena', {
    // bleUuid: 'CA6A61B7-B7A8-AF24-3C9E-04A6A5012554',
    bleUuid: 'F57439F1-3287-71B4-2251-F15797949214',
    rssiIntervalMs: undefined,
    xdfRecordPath,
    txtRecordPath: undefined,
    enableLogs: false,
    disableEeg: false,
    disablePpg: false,
    disableAccel: false,
    disableGyro: false,
})

await muse.connect()
await muse.startStreaming()

await new Promise((resolve) => setTimeout(resolve, 10000))

await muse.disconnect()

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

console.log('Done!')
