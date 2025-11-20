import BiosensorDeviceFactory from '../impl/BiosensorDeviceFactory.js'

async function main() {
    const factory = BiosensorDeviceFactory.Create()

    const [muse, recorder] = await factory.createDevice('Muse S Gen 2', {
        xdfRecordPath: 'test.xdf',
    })

    recorder.start()

    void muse.startStreaming()

    await new Promise((resolve) => {
        setTimeout(resolve, 10000)
    })

    await muse.disconnect()

    recorder.stop()

    process.exit(0)
}

main().catch((error) => {
    console.error('Error in main:', error)
})
