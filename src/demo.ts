import { exit } from 'process'
import CgxQuick20Adapter from './components/Cgx/CgxQuick20Adapter'

async function main() {
    const adapter = await CgxQuick20Adapter.Create()
    console.log(adapter)
    exit(0)
}

main().catch(console.error)
