import generateId from '@neurodevs/generate-id'
import { ChannelFormat } from '@neurodevs/ndx-native'
import { FakeStreamOutlet } from '@neurodevs/node-lsl'

import {
    DeviceController,
    DeviceControllerOptions,
} from '../../impl/BiosensorDeviceFactory.js'

export default class FakeDeviceController implements DeviceController {
    public static callsToConstructor: (DeviceControllerOptions | undefined)[] =
        []
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public static fakeSourceId = generateId()
    public static fakeType = generateId()
    public static fakeName = generateId()
    public static fakesampleRateHz = this.generateRandomInt()
    public static fakeChannelNames = [generateId(), generateId()]
    public static fakeChannelFormat = 'float32' as ChannelFormat
    public static fakeChunkSize = this.generateRandomInt()
    public static fakemaxBufferedMs = this.generateRandomInt()
    public static fakeManufacturer = generateId()
    public static fakeUnits = generateId()

    public fakeStreamQueries: string[] = [generateId(), generateId()]

    public constructor(options?: DeviceControllerOptions) {
        FakeDeviceController.callsToConstructor.push(options)
    }

    public async startStreaming() {
        FakeDeviceController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        FakeDeviceController.numCallsToStopStreaming++
    }

    public async disconnect() {
        FakeDeviceController.numCallsToDisconnect++
    }

    public streamQueries = this.fakeStreamQueries

    public outlets = this.streamQueries.map(
        () =>
            new FakeStreamOutlet({
                sourceId: FakeDeviceController.fakeSourceId,
                type: FakeDeviceController.fakeType,
                name: FakeDeviceController.fakeName,
                sampleRateHz: FakeDeviceController.fakesampleRateHz,
                channelNames: FakeDeviceController.fakeChannelNames,
                channelFormat: FakeDeviceController.fakeChannelFormat,
                chunkSize: FakeDeviceController.fakeChunkSize,
                maxBufferedMs: FakeDeviceController.fakemaxBufferedMs,
                manufacturer: FakeDeviceController.fakeManufacturer,
                units: FakeDeviceController.fakeUnits,
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
