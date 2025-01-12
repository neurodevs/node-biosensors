import { generateId } from '@sprucelabs/test-utils'
import { XdfRecorder } from '@neurodevs/node-xdf'
import { MuseAdapter } from '../../components/MuseDeviceAdapter'
import { LslProducer } from '../../types'

export default class FakeMuseAdapter implements MuseAdapter {
    public static callsToConstructor: FakeMuseAdapterCallToConstructor[] = []
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public isRunning = false

    public constructor(producer?: LslProducer, recorder?: XdfRecorder) {
        FakeMuseAdapter.callsToConstructor.push({ producer, recorder })
    }

    public async startStreaming() {
        FakeMuseAdapter.numCallsToStartStreaming++
        this.isRunning = true
    }

    public async stopStreaming() {
        FakeMuseAdapter.numCallsToStopStreaming++
        this.isRunning = false
    }

    public async disconnect() {
        FakeMuseAdapter.numCallsToDisconnect++
        this.isRunning = false
    }

    public bleUuid = `fake-${generateId()}`
    public bleName = 'fake-MuseS'

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}

export interface FakeMuseAdapterCallToConstructor {
    producer?: LslProducer
    recorder?: XdfRecorder
}
