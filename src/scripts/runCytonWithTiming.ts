import CytonDeviceController from '../impl/openbci/CytonDeviceController.js'

console.info('\nCreating Cyton controller...')

const waitAfterConnectMs = 1500

let connectStartMs = 0
let writeBCalledMs = 0
let receivedFirstRealPacket = false

let readyBuffer = Buffer.alloc(0)
let resolveReady: (() => void) | undefined

const readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve
})

const elapsed = (fromMs: number) => `${(Date.now() - fromMs).toFixed(0)}ms`

// EXPERIMENT: instead of a fixed post-connect delay, wait for the documented
// "$$$" terminator in the board's ASCII boot banner before writing 'b'.

//@ts-ignore
CytonDeviceController.onData = (
    data: Buffer,
    length: number,
    timestampSec: number
) => {
    console.info(timestampSec, data.toString('hex'), length)

    if (!resolveReady) {
        return
    }

    readyBuffer = Buffer.concat([readyBuffer, data])

    if (readyBuffer.includes('$$$')) {
        console.info(
            `"$$$" terminator seen ${elapsed(connectStartMs)} after connect() called`
        )
        resolveReady()
        resolveReady = undefined
    }

    if (!receivedFirstRealPacket && length > 1) {
        receivedFirstRealPacket = true
        console.info(
            `First real packet received ${elapsed(connectStartMs)} after connect(), ${elapsed(writeBCalledMs)} after 'b' write`
        )
    }
}

const cyton = await CytonDeviceController.Create({
    serialNumber: 'DP04WG8J',
    xdfRecordPath: './artifacts/cyton.xdf',
    waitAfterConnectMs,
})

console.info(
    `Connecting to Cyton controller with waitAfterConnectMs=${waitAfterConnectMs}...`
)

connectStartMs = Date.now()
await cyton.connect()
console.info(`connect() resolved ${elapsed(connectStartMs)} after being called`)

//@ts-ignore
await cyton.usb.writeUsb('v')

console.info('Waiting for "$$$" ready signal...')

await readyPromise

console.info('Starting streaming from Cyton...')

writeBCalledMs = Date.now()
await cyton.startStreaming()

console.info('Waiting for 10 seconds...')

await new Promise((resolve) => setTimeout(resolve, 10000))

console.info('Done!\n')
