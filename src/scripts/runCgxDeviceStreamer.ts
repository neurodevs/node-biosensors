import CgxDeviceStreamer from '../modules/CgxDeviceStreamer'

async function main() {
    const streamer = await CgxDeviceStreamer.Create()
    await streamer.startStreaming()
}

main().catch((error) => {
    console.error('Error in main:', error)
})
