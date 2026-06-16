import BiosensorStreamingOrchestrator from '../impl/BiosensorStreamingOrchestrator.js'

const orchestrator = await BiosensorStreamingOrchestrator.Create({
    deviceNames: ['Muse S Gen 2'],
    xdfRecordPath: './artifacts/test.xdf',
    webSocketPortStart: 8080,
    eventMarkers: [
        { name: 'test-marker-1', waitAfterMs: 100 },
        { name: 'test-marker-2', waitAfterMs: 100 },
    ],
})

await orchestrator.start()

console.log('Biosensor streaming orchestrator started successfully.')

await new Promise((resolve) => {
    setTimeout(resolve, 5 * 1000)
})

console.log('Stopping biosensor streaming orchestrator...')

await orchestrator.stop()

console.log('Biosensor streaming orchestrator stopped successfully.')
