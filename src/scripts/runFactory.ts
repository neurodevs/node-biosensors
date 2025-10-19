import BiosensorDeviceFactory from '../impl/BiosensorDeviceFactory'

async function main() {
    const factory = BiosensorDeviceFactory.Create()
    await factory.createDevice('Cognionics Quick-20r')
}

main().catch((error) => {
    console.error('Error in main:', error)
})
