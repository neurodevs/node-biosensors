import ZephyrDeviceController from '../impl/zephyr/ZephyrDeviceController.js'

console.info('\nCreating Zephyr controller...')

const zephyr = await ZephyrDeviceController.Create({
    address: 'a0-e6-f8-a5-69-9a',
    xdfRecordPath: './artifacts/zephyr.xdf',
})

process.on('SIGINT', async () => {
    console.info('\nCaught interrupt, disconnecting from Zephyr controller...')
    await zephyr.disconnect()
    process.exit()
})

console.info('Connecting to Zephyr controller....')

await zephyr.connect()

console.info('Starting streaming from Zephyr...')

await zephyr.startStreaming()

console.info('Waiting for 10 seconds...')

await new Promise((resolve) => setTimeout(resolve, 10000))

console.info('Disconnecting...')

await zephyr.disconnect()

console.info('Done!\n')
