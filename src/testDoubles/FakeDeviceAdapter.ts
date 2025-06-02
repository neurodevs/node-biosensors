import { generateId } from '@sprucelabs/test-utils'
import { XdfRecorder } from '@neurodevs/node-xdf'

import { DeviceAdapter, DeviceStreamer } from '../types'

export default class FakeDeviceAdapter implements DeviceAdapter {
    public static callsToConstructor: FakeMuseAdapterCallToConstructor[] = []
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public isRunning = false

    public constructor(streamer?: DeviceStreamer, recorder?: XdfRecorder) {
        FakeDeviceAdapter.callsToConstructor.push({ streamer, recorder })
    }

    public async startStreaming() {
        FakeDeviceAdapter.numCallsToStartStreaming++
        this.isRunning = true
    }

    public async stopStreaming() {
        FakeDeviceAdapter.numCallsToStopStreaming++
        this.isRunning = false
    }

    public async disconnect() {
        FakeDeviceAdapter.numCallsToDisconnect++
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
    streamer?: DeviceStreamer
    recorder?: XdfRecorder
}
