import BiosensorStreamingOrchestrator from '../impl/BiosensorStreamingOrchestrator.js'

const orchestrator = await BiosensorStreamingOrchestrator.Create({
    deviceNames: ['Muse S Gen 2'],
    xdfRecordPath: './src/__tests__/test.xdf',
    webSocketPortStart: 8080,
    eventMarkers: [
        { name: 'test-event-marker-1', waitForMs: 1000 },
        { name: 'test-event-marker-1', waitForMs: 2000 },
        { name: 'test-event-marker-1', waitForMs: 3000 },
        { name: 'test-event-marker-1', waitForMs: 4000 },
        { name: 'test-event-marker-1', waitForMs: 5000 },
    ],
})

await orchestrator.start()

console.log('Biosensor streaming orchestrator started successfully.')

await new Promise((resolve) => {
    setTimeout(resolve, 5 * 1000)
})

await orchestrator.stop()

console.log('Biosensor streaming orchestrator stopped successfully.')
