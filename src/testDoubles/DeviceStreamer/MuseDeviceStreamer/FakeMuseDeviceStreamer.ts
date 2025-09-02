import { generateId } from '@sprucelabs/test-utils'
import { DeviceStreamer } from 'types'
import { MuseDeviceStreamerConstructorOptions } from '../../../modules/MuseDeviceStreamer'

export default class FakeMuseDeviceStreamer implements DeviceStreamer {
    public static callsToConstructor: CallToMuseConstructor[] = []
    public static numCallsToConnectBle = 0
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

    public async connectBle() {
        FakeMuseDeviceStreamer.numCallsToConnectBle++
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

    public streamQueries = []

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToConnectBle = 0
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}

export type CallToMuseConstructor =
    | MuseDeviceStreamerConstructorOptions
    | undefined
