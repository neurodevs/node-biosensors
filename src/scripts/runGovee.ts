import GoveeDeviceController from '../impl/govee/GoveeDeviceController.js'

const govee = await GoveeDeviceController.Create({
    deviceUuid: '179F4A82-A2DF-C241-DB2A-1DF990779106',
    temperatureUnits: 'Fahrenheit',
})

console.info('Connecting to Govee device...')

await govee.connect()

console.info('Connected to Govee device! Streaming...')

await govee.startStreaming()

console.info('Waiting...')

await new Promise((resolve) => setTimeout(resolve, 300000))

console.info('Disconnecting from Govee device...')

await govee.disconnect()

console.info('Disconnected from Govee device!')
