import BiosensorStreamingOrchestrator from '../impl/BiosensorStreamingOrchestrator.js'

const server = await BiosensorStreamingOrchestrator.Create({
    deviceNames: ['Muse S Gen 2'],
    // xdfRecordPath: './src/__tests__/test.xdf',
    webSocketPortStart: 8080,
})

await server.start()

console.log('Biosensor streaming server started successfully.')

await new Promise((resolve) => {
    setTimeout(resolve, 5 * 1000)
})

await server.stop()

console.log('Biosensor streaming server stopped successfully.')
