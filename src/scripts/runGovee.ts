import GoveeDeviceController from '../impl/govee/GoveeDeviceController.js'

const govee = GoveeDeviceController.Create({
    deviceUuid: '179F4A82-A2DF-C241-DB2A-1DF990779106',
})

console.info('Connecting to Govee device...')

await govee.connect()

console.info('Connected to Govee device! Waiting...')

await new Promise((resolve) => setTimeout(resolve, 30000))

console.info('Disconnecting from Govee device...')

await govee.disconnect()

console.info('Disconnected from Govee device!')
