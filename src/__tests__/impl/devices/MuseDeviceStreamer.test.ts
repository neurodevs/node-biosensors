import {
    FakeBleController,
    FakeBleConnector,
    FakeBleScanner,
    FakeCharacteristic,
} from '@neurodevs/node-ble'
import { FakeStreamOutlet } from '@neurodevs/node-lsl'
import { test, assert } from '@neurodevs/node-tdd'

import MuseDeviceStreamer, {
    MuseDeviceStreamerOptions,
} from '../../../impl/devices/MuseDeviceStreamer.js'
import { MUSE_CHARACTERISTIC_UUIDS as CHAR_UUIDS } from '../../../impl/devices/MuseDeviceStreamer.js'
import SpyMuseDeviceStreamer from '../../../testDoubles/DeviceStreamer/MuseDeviceStreamer/SpyMuseDeviceStreamer.js'
import AbstractPackageTest from '../../AbstractPackageTest.js'

export default class MuseDeviceStreamerTest extends AbstractPackageTest {
    private static instance: SpyMuseDeviceStreamer
    private static museCharCallbacks: Record<string, (data: Buffer) => void>
    private static eegChars: FakeCharacteristic[]
    private static ppgChars: FakeCharacteristic[]
    private static controlChar: FakeCharacteristic

    protected static async beforeEach() {
        await super.beforeEach()

        this.setSpyMuseDeviceStreamer()

        FakeBleScanner.fakedPeripherals = [this.peripheral]

        this.instance = await this.MuseDeviceStreamer()

        this.museCharCallbacks = this.generateCallbacks()
        this.controlChar = this.fakeControlChar()

        await this.setFakeCharsOnPeripheral()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async startCallsGetCharacteristicForControlUuid() {
        await this.startStreaming()

        assert.isEqual(this.callsToGetCharacteristic[0], CHAR_UUIDS.CONTROL)
    }

    @test()
    protected static async startWritesControlCommands() {
        await this.startStreaming()

        assert.isEqualDeep(
            this.controlChar.callsToWriteAsync,
            [
                this.generateExpectedCall('h'),
                this.generateExpectedCall('p50'),
                this.generateExpectedCall('s'),
                this.generateExpectedCall('d'),
            ],
            'Should write to the control characteristic!'
        )
    }

    @test()
    protected static async createsLslOutletForEegChannels() {
        const firstCall = FakeStreamOutlet.callsToConstructor[0]

        assert.isEqualDeep(firstCall, {
            name: 'Muse EEG',
            type: 'EEG',
            channelNames: this.eegCharNames,
            sampleRateHz: this.eegsampleRateHz,
            channelFormat: 'float32',
            sourceId: 'muse-eeg',
            manufacturer: 'Interaxon Inc.',
            units: 'microvolt',
            chunkSize: 1,
        })
    }

    @test()
    protected static async outletPushesEegSampleForEachChunk() {
        this.simulateEegForChars(this.emptyEegBuffer)

        const emptySample = [0, 0, 0, 0, 0]
        const expected = Array(this.eegChunkSize).fill(emptySample)

        assert.isEqualDeep(
            this.callsToPushSample,
            expected,
            'Should push an EEG sample for each chunk!'
        )
    }

    @test()
    protected static async ignoresFirstTwoEegSamplesThatAreCounters() {
        const increasingData = this.createIncreasingData(this.eegChunkSize)

        const increasingBuffer = Buffer.from(increasingData)
        this.simulateEegForChars(increasingBuffer)

        assert.isEqualDeep(
            this.firstCallToPushSample,
            [2, 2, 2, 2, 2],
            'Did not ignore the first two EEG samples!'
        )
    }

    private static createIncreasingData(size = 0) {
        return Array(size)
            .fill(0)
            .map((_, i) => i)
    }

    @test()
    protected static async createsLslOutletForPpgChannels() {
        const secondCall = FakeStreamOutlet.callsToConstructor[1]

        assert.isEqualDeep(secondCall, {
            name: 'Muse PPG',
            type: 'PPG',
            channelNames: this.ppgCharNames,
            sampleRateHz: this.ppgsampleRateHz,
            channelFormat: 'float32',
            sourceId: 'muse-s-ppg',
            manufacturer: 'Interaxon Inc.',
            units: 'N/A',
            chunkSize: 1,
        })
    }

    @test()
    protected static async outletPushesPpgSampleForEachChunk() {
        const sample = Array(this.ppgSize).fill(0) as number[]
        this.simulatePpgForChars(Buffer.from(sample))

        const decoded = this.decodeUnsigned24BitData(sample.slice(2))
        const ppgSamples = this.generatePpgSamples(decoded)

        assert.isEqualDeep(
            this.callsToPushSample,
            ppgSamples,
            'Should push a PPG sample for each chunk!'
        )
    }

    @test()
    protected static async ignoresFirstTwoPpgSamplesThatAreCounters() {
        const increasingData = Array(this.ppgChunkSize)
            .fill(0)
            .map((_, i) => i)

        const increasingBuffer = Buffer.from(increasingData)
        this.simulatePpgForChars(increasingBuffer)

        assert.isEqualDeep(
            this.firstCallToPushSample,
            [131844, 131844, 131844],
            'Did not ignore the first two PPG samples!'
        )
    }

    @test()
    protected static async stopStreamingSendsHaltCmdToMuse() {
        await this.startStreaming()
        this.controlChar.resetTestDouble()
        await this.stopStreaming()

        assert.isEqualDeep(
            this.controlChar.callsToWriteAsync,
            [this.generateExpectedCall('h')],
            'Should send stop command to Muse!'
        )
    }

    @test()
    protected static async decodesUnsigned24BitPpgData() {
        const numBytesPerSample = 3

        const len = this.numTimestamps + numBytesPerSample * this.ppgChunkSize
        const samples = Array.from({ length: len }, (_, i) => i)

        const decoded = this.decodeUnsigned24BitData(
            samples.slice(2)
        ) as number[]

        this.simulatePpgForChars(Buffer.from(samples))

        const ppgSamples = this.generatePpgSamples(decoded)

        assert.isEqualDeep(
            this.callsToPushSample,
            ppgSamples,
            'Should push a PPG sample for each chunk!'
        )
    }

    @test()
    protected static async doesNotCreateSecondBleDeviceConnector() {
        await this.startStreaming()
        await this.startStreaming()

        assert.isEqual(
            FakeBleConnector.numCallsToConnectBle,
            1,
            'Should not recreate the BLE device connector!'
        )
    }

    @test()
    protected static async disconnectCallsStopStreaming() {
        let wasHit = false

        this.instance.stopStreaming = async () => {
            wasHit = true
        }

        await this.startStreamingThenDisconnect()

        assert.isTrue(wasHit, 'Should call stopStreaming on disconnect!')
    }

    @test()
    protected static async disconnectCallsDisconnectBleOnConnector() {
        await this.startStreaming()
        await this.instance.disconnect()

        assert.isEqual(
            FakeBleConnector.numCallsToDisconnectBle,
            1,
            'Should close the BLE connector on disconnect!'
        )
    }

    @test()
    protected static async disconnectClearsBleConnectorFromInstance() {
        await this.startStreaming()
        await this.disconnect()

        assert.isUndefined(
            this.instance.getBleConnector(),
            'Should clear the BLE connector from the instance!'
        )
    }

    @test()
    protected static async callsDestroyOnLslOutletsOnDisconnect() {
        await this.startStreaming()
        await this.disconnect()

        assert.isEqual(
            FakeStreamOutlet.numCallsToDestroy,
            2,
            'Should call destroy on both LSL outlets!'
        )
    }

    @test()
    protected static async stopStreamingDoesNothingIfNoBle() {
        await this.stopStreaming()

        assert.isEqual(
            FakeBleController.numCallsToDisconnect,
            0,
            'Should not call getCharacteristic if not connected!'
        )
    }

    @test()
    protected static async disconnectDoesNothingIfNoBle() {
        await this.disconnect()

        assert.isEqual(
            FakeBleController.numCallsToDisconnect,
            0,
            'Should not call disconnect if not connected!'
        )
    }

    @test()
    protected static async exposesStreamQueriesReadonlyField() {
        const streamer = await this.MuseDeviceStreamer()

        assert.isEqualDeep(
            streamer.streamQueries,
            ['type="EEG"', 'type="PPG"'],
            'Should expose stream queries!'
        )
    }

    @test()
    protected static async exposesLslOutlets() {
        assert.isEqual(
            this.instance.outlets.length,
            2,
            'Did not expose outlets!'
        )
    }

    private static async startStreaming() {
        await this.instance.startStreaming()
    }

    private static async stopStreaming() {
        await this.instance.stopStreaming()
    }

    private static async startStreamingThenDisconnect() {
        await this.startStreaming()
        await this.disconnect()
    }

    private static async disconnect() {
        await this.instance.disconnect()
    }

    private static generatePpgSamples(decoded: number[]) {
        let expected: number[][] = []

        for (let i = 0; i < this.ppgChunkSize; i++) {
            const val = decoded[i]
            expected.push([val, val, val])
        }
        return expected
    }

    private static generateCallbacks() {
        return {
            ...this.generateEegCallbacks(),
            ...this.generatePpgCallbacks(),
        }
    }

    private static generateEegCallbacks() {
        return this.eegCharNames.reduce(
            (acc, name) => ({
                ...acc,
                [CHAR_UUIDS[name]]: this.handleEegChannelData.bind(
                    this.instance
                ),
            }),
            {}
        )
    }

    private static generatePpgCallbacks() {
        return this.ppgCharNames.reduce(
            (acc, name) => ({
                ...acc,
                [CHAR_UUIDS[name]]: this.handlePpgChannelData.bind(
                    this.instance
                ),
            }),
            {}
        )
    }

    private static get handleEegChannelData() {
        return this.instance.getHandleEegChannelForChunk()
    }

    private static get handlePpgChannelData() {
        return this.instance.getHandlePpgChannelForChunk()
    }

    private static decodeUnsigned24BitData(samples: number[]) {
        const decodedSamples = []
        const numBytesPerSample = 3

        for (let i = 0; i < samples.length; i += numBytesPerSample) {
            const mostSignificantByte = samples[i] << 16
            const middleByte = samples[i + 1] << 8
            const leastSignificantByte = samples[i + 2]

            const val = mostSignificantByte | middleByte | leastSignificantByte
            decodedSamples.push(val)
        }

        return decodedSamples
    }

    private static async setFakeCharsOnPeripheral() {
        this.eegChars = await this.createFakeEegChars()
        this.ppgChars = await this.createFakePpgChars()

        this.peripheral.setFakeCharacteristics(this.eegChars)

        FakeBleScanner.fakedPeripherals = [this.peripheral]
    }

    private static async createFakeEegChars() {
        const fakeChars: FakeCharacteristic[] = []

        for (let i = 0; i < this.eegNumChannels; i++) {
            const charUuid = this.eegCharUuids[i]
            const char = this.FakeCharacteristic(charUuid)
            await char.subscribeAsync()

            const callback = this.museCharCallbacks[charUuid]
            char.on('data', callback)

            fakeChars.push(char)
        }
        return fakeChars
    }

    private static async createFakePpgChars() {
        const fakeChars: FakeCharacteristic[] = []

        for (let i = 0; i < this.ppgNumChannels; i++) {
            const charUuid = this.ppgCharUuids[i]
            const char = this.FakeCharacteristic(charUuid)
            await char.subscribeAsync()

            const callback = this.museCharCallbacks[charUuid]
            char.on('data', callback)

            fakeChars.push(char)
        }
        return fakeChars
    }

    private static fakeControlChar() {
        const control = this.FakeCharacteristic(this.controlUuid)

        FakeBleController.fakeCharacteristics = {
            [this.controlUuid]: control as any,
        }

        return control
    }

    private static generateExpectedCall(cmd: string) {
        return { data: this.encodeCommand(cmd), withoutResponse: true }
    }

    private static encodeCommand(cmd: string) {
        const encoded = new TextEncoder().encode(`X${cmd}\n`)
        encoded[0] = encoded.length - 1
        return Buffer.from(encoded)
    }

    private static simulateEegForChars(buffer: Buffer) {
        this.eegChars.forEach((char) => {
            char.simulateDataReceived(buffer)
        })
    }

    private static simulatePpgForChars(buffer: Buffer) {
        this.ppgChars.forEach((char) => {
            char.simulateDataReceived(buffer)
        })
    }

    private static get callsToGetCharacteristic() {
        return FakeBleController.callsToGetCharacteristic
    }

    private static get callsToPushSample() {
        return FakeStreamOutlet.callsToPushSample
    }

    private static get firstCallToPushSample() {
        return FakeStreamOutlet.callsToPushSample[0]
    }

    private static readonly eegCharNames = [
        'EEG_TP9',
        'EEG_AF7',
        'EEG_AF8',
        'EEG_TP10',
        'EEG_AUX',
    ]

    private static readonly ppgCharNames = [
        'PPG_AMBIENT',
        'PPG_INFRARED',
        'PPG_RED',
    ]

    private static readonly eegCharUuids = this.eegCharNames.map(
        (name) => CHAR_UUIDS[name]
    )

    private static readonly ppgCharUuids = this.ppgCharNames.map(
        (name) => CHAR_UUIDS[name]
    )

    private static readonly bleLocalName = 'MuseS'
    private static readonly controlUuid: string = CHAR_UUIDS.CONTROL
    private static readonly numTimestamps = 2

    private static readonly eegsampleRateHz = 256
    private static readonly eegChunkSize = 12
    private static readonly eegSize = this.numTimestamps + this.eegChunkSize
    private static readonly emptyEegChunk = Array(this.eegSize).fill(0)
    private static readonly emptyEegBuffer = Buffer.from(this.emptyEegChunk)
    private static readonly eegNumChannels = this.eegCharNames.length

    private static readonly ppgsampleRateHz = 64
    private static readonly ppgChunkSize = 6
    private static readonly bytesPerSample = 3
    private static readonly ppgBytes = this.bytesPerSample * this.ppgChunkSize
    private static readonly ppgSize = this.numTimestamps + this.ppgBytes
    private static readonly ppgNumChannels = this.ppgCharNames.length

    private static readonly peripheral = this.FakePeripheral({
        localName: this.bleLocalName,
    })

    private static async MuseDeviceStreamer(
        options?: MuseDeviceStreamerOptions
    ) {
        return (await MuseDeviceStreamer.Create(
            options
        )) as SpyMuseDeviceStreamer
    }
}
