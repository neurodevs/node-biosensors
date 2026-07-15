import CytonDeviceController from '../impl/openbci/CytonDeviceController.js'

console.info('\nCreating Cyton controller...')

const cyton = await CytonDeviceController.Create({
    serialNumber: 'DP04WG8J',
    xdfRecordPath: './artifacts/cyton.xdf',
})

console.info('Connecting to Cyton controller....')

await cyton.connect()

console.info('Starting streaming from Cyton...')

await cyton.startStreaming()

console.info('Waiting for 10 seconds...')

await new Promise((resolve) => setTimeout(resolve, 10000))

console.info('Done!\n')
