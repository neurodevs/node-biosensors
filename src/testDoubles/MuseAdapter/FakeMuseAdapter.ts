import { generateId } from '@sprucelabs/test-utils'
import { MuseAdapter } from '../../components/MuseDeviceAdapter'

export default class FakeMuseAdapter implements MuseAdapter {
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public isRunning = false

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
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}
