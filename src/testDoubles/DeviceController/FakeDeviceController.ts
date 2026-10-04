import DeviceStateEmitter from '../../impl/DeviceStateEmitter.js'
import generateId from '@neurodevs/generate-id'
import { ChannelFormat } from '@neurodevs/ndx-native'
import { FakeLslOutlet } from '@neurodevs/node-lsl'

import {
    DeviceController,
    DeviceControllerConstructorOptions,
    DeviceName,
    DeviceStateListener,
} from '../../types.js'

export default class FakeDeviceController implements DeviceController {
    private readonly stateEmitter = new DeviceStateEmitter()

    public static callsToConstructor: (
        DeviceControllerConstructorOptions | undefined
    )[] = []
    public static numCallsToConnect = 0
    public static numCallsToStartStreaming = 0
    public static numCallsToStopStreaming = 0
    public static numCallsToDisconnect = 0

    public static fakeDeviceName: DeviceName = 'Muse S Gen 2'
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

    public deviceName = FakeDeviceController.fakeDeviceName
    public fakeStreamQueries: string[] = [generateId(), generateId()]

    public constructor(options?: DeviceControllerConstructorOptions) {
        FakeDeviceController.callsToConstructor.push(options)
    }

    public async connect() {
        this.stateEmitter.setState('connecting')
        this.stateEmitter.setState('connected')
        FakeDeviceController.numCallsToConnect++
    }

    public async startStreaming() {
        this.stateEmitter.setState('streaming')
        FakeDeviceController.numCallsToStartStreaming++
    }

    public async stopStreaming() {
        this.stateEmitter.setState('connected')
        FakeDeviceController.numCallsToStopStreaming++
    }

    public async disconnect() {
        this.stateEmitter.setState('disconnected')
        FakeDeviceController.numCallsToDisconnect++
    }

    public streamQueries = this.fakeStreamQueries

    public outlets = this.streamQueries.map(
        () =>
            new FakeLslOutlet({
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

    public get state() {
        return this.stateEmitter.state
    }

    public addStateListener(listener: DeviceStateListener) {
        return this.stateEmitter.addStateListener(listener)
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToConnect = 0
        this.numCallsToStartStreaming = 0
        this.numCallsToStopStreaming = 0
        this.numCallsToDisconnect = 0
    }
}
