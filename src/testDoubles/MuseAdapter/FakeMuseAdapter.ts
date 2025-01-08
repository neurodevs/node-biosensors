import { generateId } from '@sprucelabs/test-utils'
import { MuseAdapter } from '../../components/MuseDeviceAdapter'

export default class FakeMuseAdapter implements MuseAdapter {
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public async startStreaming() {
        FakeMuseAdapter.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeMuseAdapter.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeMuseAdapter.numCallsToDisconnect++
    }

    public bleUuid = `fake-${generateId()}`
    public bleName = 'fake-MuseS'

    public static resetTestDouble() {
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}
