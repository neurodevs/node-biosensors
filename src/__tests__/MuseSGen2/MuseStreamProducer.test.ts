import { test, assert } from '@sprucelabs/test-utils'
import {
    BleDeviceAdapter,
    FakeBleAdapter,
    FakeBleScanner,
    FakeCharacteristic,
    FakePeripheral,
    SpyBleAdapter,
} from '@neurodevs/node-ble'
import { FakeLslOutlet } from '@neurodevs/node-lsl'
import MuseStreamProducer, {
    MuseLslProducerOptions,
} from '../../components/MuseSGen2/MuseStreamProducer'
import { MUSE_CHARACTERISTIC_UUIDS as CHAR_UUIDS } from '../../components/MuseSGen2/MuseStreamProducer'
import SpyMuseProducer from '../../testDoubles/MuseProducer/SpyMuseProducer'
import AbstractBiosensorsTest from '../AbstractBiosensorsTest'

export default class MuseStreamProducerTest extends AbstractBiosensorsTest {
    private static instance: SpyMuseProducer
    private static museCharCallbacks: Record<string, (data: Buffer) => void>
    private static eegChars: FakeCharacteristic[]
    private static ppgChars: FakeCharacteristic[]
    private static controlChar: FakeCharacteristic

    protected static async beforeEach() {
        await super.beforeEach()

        this.setSpyMuseProducer()

        FakeBleScanner.fakedPeripherals = [this.peripheral]

        this.instance = await this.MuseStreamProducer()

        this.museCharCallbacks = this.generateCallbacks()
        this.controlChar = this.fakeControlChar()

        await this.setFakeCharsOnPeripheral()
    }

    @test()
    protected static async canCreateMuseStreamProducer() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    @test()
    protected static async createsBleDeviceScanner() {
        assert.isEqual(
            FakeBleScanner.callsToConstructor.length,
            1,
            'Should create an instance of BleDeviceScanner!'
        )
    }

    @test()
    protected static async callsScanForNameOnBleDeviceScanner() {
        const { name, options } = this.callsToScanForName[0]

        assert.isEqual(
            name,
            'MuseS',
            'Should call scanForName on BleDeviceScanner!'
        )

        const { characteristicCallbacks } = options ?? {}

        assert.isEqualDeep(
            Object.keys(characteristicCallbacks ?? {}),
            Object.keys(this.museCharCallbacks),
            'Should call scanForName with the correct options!'
        )
    }

    @test()
    protected static async startCallsGetCharacteristicForControlUuid() {
        await this.start()

        assert.isEqual(this.callsToGetCharacteristic[0], CHAR_UUIDS.CONTROL)
    }

    @test()
    protected static async startWritesControlCommands() {
        await this.start()

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
        const firstCall = FakeLslOutlet.callsToConstructor[0]

        assert.isEqualDeep(firstCall.options, {
            name: 'Muse S Gen 2 EEG',
            type: 'EEG',
            channelNames: this.eegCharNames,
            sampleRate: this.eegSampleRate,
            channelFormat: 'float32',
            sourceId: 'muse-eeg',
            manufacturer: 'Interaxon Inc.',
            unit: 'microvolt',
            chunkSize: this.eegChunkSize,
            maxBuffered: 360,
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
    protected static async ignoresFirstTwoEegSamplesThatAreTimestamps() {
        const increasingData = this.createIncreasingData(this.eegChunkSize)

        const increasingBuffer = Buffer.from(increasingData)
        this.simulateEegForChars(increasingBuffer)

        assert.isEqualDeep(
            this.firstCallToPushSample,
            [2, 2, 2, 2, 2],
            'Should ignore the first two EEG samples that are timestamps!'
        )
    }

    private static createIncreasingData(size = 0) {
        return Array(size)
            .fill(0)
            .map((_, i) => i)
    }

    @test()
    protected static async createsLslOutletForPpgChannels() {
        const secondCall = FakeLslOutlet.callsToConstructor[1]

        assert.isEqualDeep(secondCall.options, {
            name: 'Muse S Gen 2 PPG',
            type: 'PPG',
            channelNames: this.ppgCharNames,
            sampleRate: this.ppgSampleRate,
            channelFormat: 'float32',
            sourceId: 'muse-s-ppg',
            manufacturer: 'Interaxon Inc.',
            unit: 'N/A',
            chunkSize: this.ppgChunkSize,
            maxBuffered: 360,
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
    protected static async ignoresFirstTwoPpgSamplesThatAreTimestamps() {
        const increasingData = Array(this.ppgChunkSize)
            .fill(0)
            .map((_, i) => i)

        const increasingBuffer = Buffer.from(increasingData)
        this.simulatePpgForChars(increasingBuffer)

        assert.isEqualDeep(
            this.firstCallToPushSample,
            [131844, 131844, 131844],
            'Should ignore the first two EEG samples that are timestamps!'
        )
    }

    @test()
    protected static async canDisableConnectBleOnCreate() {
        FakeBleAdapter.resetTestDouble()

        await this.MuseStreamProducer({
            connectBleOnCreate: false,
        })

        assert.isEqual(
            FakeBleAdapter.numCallsToConnect,
            0,
            'Should not connect to BleAdapter!'
        )
    }

    @test()
    protected static async passesOptionalBleUuidToScanner() {
        FakeBleScanner.resetTestDouble()

        await this.MuseStreamProducer({
            bleUuid: this.peripheral.uuid,
        })

        assert.isEqual(
            FakeBleScanner.callsToScanForUuid[0]?.uuid,
            this.peripheral.uuid,
            'Should pass uuid to BleDeviceScanner!'
        )
    }

    @test()
    protected static async passesOptionalRssiIntervalMsToBle() {
        BleDeviceAdapter.Class = SpyBleAdapter
        const rssiIntervalMs = 10

        const instance = await this.MuseStreamProducer({
            rssiIntervalMs,
        })

        const ble = instance.bleAdapter as SpyBleAdapter
        const actualRssi = ble.getRssiIntervalMs()

        assert.isEqual(
            actualRssi,
            rssiIntervalMs,
            'Should pass rssiIntervalMs to BleDeviceScanner!'
        )
    }

    @test()
    protected static async stopLslStreamsSendsHaltCmdToMuse() {
        this.controlChar.resetTestDouble()

        await this.instance.stopLslStreams()

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
    protected static async disconnectBleCallsDisconnectOnPeripheral() {
        await this.disconnectBle()

        assert.isEqual(
            FakeBleAdapter.numCallsToDisconnect,
            1,
            'Should call disconnect on BleAdapter!'
        )
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

        FakeBleAdapter.fakeCharacteristics = {
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

    private static async start() {
        await this.instance.startLslStreams()
    }

    private static async disconnectBle() {
        await this.instance.disconnectBle()
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

    private static get callsToScanForName() {
        return FakeBleScanner.callsToScanForName
    }

    private static get callsToGetCharacteristic() {
        return FakeBleAdapter.callsToGetCharacteristic
    }

    private static get callsToPushSample() {
        return FakeLslOutlet.callsToPushSample
    }

    private static get firstCallToPushSample() {
        return FakeLslOutlet.callsToPushSample[0]
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

    private static readonly eegSampleRate = 256
    private static readonly eegChunkSize = 12
    private static readonly eegSize = this.numTimestamps + this.eegChunkSize
    private static readonly emptyEegChunk = Array(this.eegSize).fill(0)
    private static readonly emptyEegBuffer = Buffer.from(this.emptyEegChunk)
    private static readonly eegNumChannels = this.eegCharNames.length

    private static readonly ppgSampleRate = 64
    private static readonly ppgChunkSize = 6
    private static readonly bytesPerSample = 3
    private static readonly ppgBytes = this.bytesPerSample * this.ppgChunkSize
    private static readonly ppgSize = this.numTimestamps + this.ppgBytes
    private static readonly ppgNumChannels = this.ppgCharNames.length

    private static readonly peripheral = new FakePeripheral({
        localName: this.bleLocalName,
    })

    private static FakeCharacteristic(uuid: string) {
        return new FakeCharacteristic({ uuid })
    }

    private static async MuseStreamProducer(options?: MuseLslProducerOptions) {
        return (await MuseStreamProducer.Create(options)) as SpyMuseProducer
    }
}
