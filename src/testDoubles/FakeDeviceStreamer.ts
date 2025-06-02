import { generateId } from '@sprucelabs/test-utils'
import { DeviceStreamer } from 'types'
import { MuseDeviceStreamerConstructorOptions } from '../modules/MuseDeviceStreamer'

export default class FakeDeviceStreamer implements DeviceStreamer {
    public static callsToConstructor: CallToConstructor[] = []
    public static numCallsToConnectBle = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public readonly bleUuid: string
    public readonly bleName = 'fake-MuseS'

    public constructor(options?: MuseDeviceStreamerConstructorOptions) {
        const { bleUuid } = options ?? {}
        this.bleUuid = bleUuid ?? `fake-${generateId()}`

        FakeDeviceStreamer.callsToConstructor.push(options)
    }

    public async connectBle() {
        FakeDeviceStreamer.numCallsToConnectBle++
    }

    public async startStreaming() {
        FakeDeviceStreamer.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeDeviceStreamer.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeDeviceStreamer.numCallsToDisconnect++
    }

    public readonly streamQueries = []

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToConnectBle = 0
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}

export type CallToConstructor = MuseDeviceStreamerConstructorOptions | undefined
