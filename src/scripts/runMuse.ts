import { TimestampJitterGrapher } from '@neurodevs/node-biosignal-processing'

import MuseDeviceController from '../impl/devices/MuseDeviceController.js'

const xdfRecordPath = './artifacts/muse_data.xdf'

const muse = await MuseDeviceController.Create({
    bleUuid: 'CA6A61B7-B7A8-AF24-3C9E-04A6A5012554',
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

await new Promise((resolve) => setTimeout(resolve, 5000))

await muse.stopStreaming()

await new Promise((resolve) => setTimeout(resolve, 2000))

await muse.startStreaming()

await new Promise((resolve) => setTimeout(resolve, 2000))

await muse.disconnect()

await muse.connect()
await muse.startStreaming()

await new Promise((resolve) => setTimeout(resolve, 2000))

await muse.stopStreaming()
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
