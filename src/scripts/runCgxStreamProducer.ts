import CgxStreamProducer from '../modules/Cgx/CgxStreamProducer'

async function main() {
    const producer = await CgxStreamProducer.Create()

    await producer.startLslStreams()
}

main().catch((error) => {
    console.error('Error in main:', error)
})
