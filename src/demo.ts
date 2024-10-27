import CgxQuick20Adapter from './CgxQuick20Adapter'

async function main() {
    const adapter = await CgxQuick20Adapter.Create()
    console.log(adapter)
}

main().catch(console.error)
