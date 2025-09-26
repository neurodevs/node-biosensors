import { generateId } from '@sprucelabs/test-utils'
import { ChannelFormat, FakeLslOutlet } from '@neurodevs/node-lsl'
import { DeviceStreamer, DeviceStreamerOptions } from 'types'

export default class FakeDeviceStreamer implements DeviceStreamer {
    public static callsToConstructor: (DeviceStreamerOptions | undefined)[] = []
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public fakeStreamQueries: string[] = [generateId(), generateId()]

    public static fakeSourceId = generateId()
    public static fakeType = generateId()
    public static fakeName = generateId()
    public static fakeSampleRate = this.generateRandomInt()
    public static fakeChannelNames = [generateId(), generateId()]
    public static fakeChannelFormat = 'float32' as ChannelFormat
    public static fakeChunkSize = this.generateRandomInt()
    public static fakeMaxBuffered = this.generateRandomInt()
    public static fakeManufacturer = generateId()
    public static fakeUnit = generateId()

    public constructor(options?: DeviceStreamerOptions) {
        FakeDeviceStreamer.callsToConstructor.push(options)
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

    public streamQueries = this.fakeStreamQueries

    public outlets = this.streamQueries.map(
        () =>
            new FakeLslOutlet(undefined, {
                sourceId: FakeDeviceStreamer.fakeSourceId,
                type: FakeDeviceStreamer.fakeType,
                name: FakeDeviceStreamer.fakeName,
                sampleRate: FakeDeviceStreamer.fakeSampleRate,
                channelNames: FakeDeviceStreamer.fakeChannelNames,
                channelFormat: FakeDeviceStreamer.fakeChannelFormat,
                chunkSize: FakeDeviceStreamer.fakeChunkSize,
                maxBuffered: FakeDeviceStreamer.fakeMaxBuffered,
                manufacturer: FakeDeviceStreamer.fakeManufacturer,
                unit: FakeDeviceStreamer.fakeUnit,
            })
    )

    private static generateRandomInt() {
        return Math.ceil(Math.random() * 10)
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}
