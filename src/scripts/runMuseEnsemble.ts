import { TimestampJitterGrapher } from '@neurodevs/node-biosignal-processing'

import { DeviceSpecification } from '../impl/BiosensorDeviceFactory.js'
import BiosensorStreamingOrchestrator from '../impl/BiosensorStreamingOrchestrator.js'

const xdfRecordPath = './artifacts/muse_ensemble.xdf'

const devices: DeviceSpecification[] = [
    {
        deviceName: 'Muse S Athena',
        bleUuid: 'F57439F1-3287-71B4-2251-F15797949214',
    },
    {
        deviceName: 'Muse S Gen 2',
        bleUuid: 'CA6A61B7-B7A8-AF24-3C9E-04A6A5012554',
    },
    {
        deviceName: 'Muse S Gen 1',
        // bleUuid: 'PLACEHOLDER-MUSE-S-GEN-1-BLE-UUID',
    },
    {
        deviceName: 'Muse 2',
        bleUuid: 'F868B42C-FA67-F9CA-BC95-76269D21C38F',
    },
    {
        deviceName: 'Muse 1 Gen 2',
        // bleUuid: 'PLACEHOLDER-MUSE-1-GEN-2-BLE-UUID',
    },
]

const orchestrator = await BiosensorStreamingOrchestrator.Create({
    devices,
    xdfRecordPath,
})

try {
    console.info('Starting orchestrator...')
    await orchestrator.start()

    console.info('Waiting for 10 seconds...')
    await new Promise((resolve) => setTimeout(resolve, 10000))

    console.info('Stopping all devices...')
    await orchestrator.stop()

    console.info('Waiting for 5 seconds...')
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
} catch (err) {
    console.error('Orchestrator failed:', err)
    await orchestrator.stop()
}
