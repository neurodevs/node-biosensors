import generateId from '@neurodevs/generate-id'
import { FakeStreamOutlet } from '@neurodevs/node-lsl'

import { DeviceStreamer } from 'impl/BiosensorDeviceFactory.js'
import { MuseDeviceStreamerConstructorOptions } from '../../../impl/devices/MuseDeviceStreamer.js'

export default class FakeMuseDeviceStreamer implements DeviceStreamer {
    public static callsToConstructor: (
        | MuseDeviceStreamerConstructorOptions
        | undefined
    )[] = []

    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public readonly bleUuid: string
    public readonly bleName = 'fake-MuseS'

    public constructor(options?: MuseDeviceStreamerConstructorOptions) {
        const { bleUuid } = options ?? {}
        this.bleUuid = bleUuid ?? `fake-${generateId()}`

        FakeMuseDeviceStreamer.callsToConstructor.push(options)
    }

    public async startStreaming() {
        FakeMuseDeviceStreamer.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeMuseDeviceStreamer.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeMuseDeviceStreamer.numCallsToDisconnect++
    }

    public fakeEegOutlet = new FakeStreamOutlet()
    public fakePpgOutlet = new FakeStreamOutlet()

    public get outlets() {
        return [this.fakeEegOutlet, this.fakePpgOutlet]
    }

    public streamQueries = ['type="EEG"', 'type="PPG"']

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}
