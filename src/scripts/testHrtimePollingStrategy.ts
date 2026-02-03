import { LslStreamOutlet } from '@neurodevs/node-lsl'
import { XdfStreamRecorder } from '@neurodevs/node-xdf'

const PERIOD_NS = 2_000_000n // 2 ms = 500 Hz

const outlet = await LslStreamOutlet.Create({
    name: 'Timing Outlet',
    type: 'TIMING',
    sourceId: 'timing-outlet',
    channelFormat: 'float32',
    channelNames: Array.from({ length: 25 }, (_, i) => `Ch${i + 1}`),
    sampleRateHz: 500,
    chunkSize: 1,
})

const recorder = await XdfStreamRecorder.Create(
    './artifacts/timing-outlet.xdf',
    ['type="TIMING"']
)

recorder.start()

await new Promise((resolve) => setTimeout(resolve, 2000))

const startTime = process.hrtime.bigint()
let nextTickTime = startTime + PERIOD_NS

const sample = new Array(25).fill(0).map(() => Math.random() * 100)

function loop() {
    const now = process.hrtime.bigint()

    if (now >= nextTickTime) {
        // Internally generates timestamp from lsl.local_clock(), not hrtime
        outlet.pushSample(sample)
        nextTickTime += PERIOD_NS
    }

    if (now - startTime > 10n * 1000000000n) {
        return
    }

    setImmediate(loop)
}

loop()
