import { TimestampJitterGrapher } from '@neurodevs/node-biosignal-processing'

import MuseDeviceController from '../impl/muse/MuseDeviceController.js'

const xdfRecordPath = './artifacts/muse_data.xdf'

const muse = await MuseDeviceController.Create({
    bleUuid: undefined,
    model: undefined,
    rssiIntervalMs: undefined,
    xdfRecordPath,
    txtRecordPath: undefined,
    enableLogs: true,
    disableEeg: false,
    disablePpg: false,
    disableAccel: false,
    disableGyro: false,
})

console.info('Connecting...')
await muse.connect()

console.info('Starting streaming...')
await muse.startStreaming()

console.info('Streaming for 10 seconds...')
await new Promise((resolve) => setTimeout(resolve, 10000))

console.info('Disconnecting...')
await muse.disconnect()

console.info('Waiting for 5 seconds...')
await new Promise((resolve) => setTimeout(resolve, 5000))

console.info('Running timestamp jitter grapher...')
const grapher = await TimestampJitterGrapher.Create(
    xdfRecordPath,
    './artifacts',
    {
        totalSecs: 3,
        ignoreInterpolatedTimestamps: false,
        showIdealIntervalMs: true,
        xAxisUnits: 'milliseconds',
    }
)
await grapher.run()

console.info('Done!\n')
