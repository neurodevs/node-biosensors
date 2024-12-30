import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import {
    BleDeviceAdapter,
    BleDeviceScanner,
    FakeBleAdapter,
    FakeBleScanner,
    FakeCharacteristic,
    FakePeripheral,
} from '@neurodevs/node-ble'
import {
    FakeLslOutlet,
    FakeStreamInfo,
    LslStreamInfo,
    LslStreamOutlet,
} from '@neurodevs/node-lsl'
import { MUSE_CHARACTERISTIC_UUIDS } from '../../components/MuseSGen2/museCharacteristicUuids'
import MuseStreamGenerator, {
    StreamGeneratorConstructorOptions,
} from '../../components/MuseSGen2/MuseStreamGenerator'

export default class MuseStreamGeneratorTest extends AbstractSpruceTest {
    private static instance: SpyMuseStreamGenerator
    private static museCharCallbacks: Record<string, (data: Buffer) => void>

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeBleAdapter()
        this.setFakeBleScanner()
        this.setFakeLslOutlet()
        this.setFakeStreamInfo()
        this.setSpyMuseStreamGenerator()

        this.instance = await this.MuseStreamGenerator()

        this.museCharCallbacks = this.generateCallbacks()
    }

    @test()
    protected static async canCreateMuseStreamGenerator() {
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
        this.fakeControlChar()

        await this.start()

        assert.isEqual(
            this.callsToGetCharacteristic[0],
            MUSE_CHARACTERISTIC_UUIDS.CONTROL
        )
    }

    @test()
    protected static async startWritesControlCommands() {
        const control = this.fakeControlChar()

        await this.start()

        assert.isEqualDeep(
            control.callsToWriteAsync,
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
        assert.isEqualDeep(FakeLslOutlet.callsToConstructor[0].options, {
            name: 'Muse S Gen 2 EEG',
            type: 'EEG',
            channelNames: this.eegChannelNames,
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
    protected static async createsLslOutletForPpgChannels() {
        assert.isEqualDeep(FakeLslOutlet.callsToConstructor[1].options, {
            name: 'Muse S Gen 2 PPG',
            type: 'PPG',
            channelNames: MuseStreamGeneratorTest.ppgChannelNames,
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
    protected static async outletPushesEegSampleForEachChunk() {
        const fakeChars = await this.createFakeEegChars()
        this.peripheral.setFakeCharacteristics(fakeChars)

        FakeBleScanner.fakedPeripherals = [this.peripheral]

        void this.instance.start()
        await this.wait(10)

        fakeChars.forEach((char) => {
            char.simulateDataReceived(
                Buffer.from(Array(this.eegChunkSize).fill(0))
            )
        })

        await this.wait(10)

        assert.isEqualDeep(
            FakeLslOutlet.callsToPushSample.length,
            this.eegChunkSize
        )
    }

    private static async createFakeEegChars() {
        const fakeChars: FakeCharacteristic[] = []

        for (let i = 0; i < this.eegNumChannels; i++) {
            const charUuid = this.eegCharUuids[i]
            const char = new FakeCharacteristic({ uuid: charUuid })
            await char.subscribeAsync()

            const callback = this.museCharCallbacks[this.eegCharUuids[i]]
            char.on('data', callback)

            fakeChars.push(char)
        }
        return fakeChars
    }

    private static fakeControlChar() {
        const control = new FakeCharacteristic({
            uuid: this.controlUuid,
        })

        FakeBleAdapter.fakeCharacteristics = {
            [this.controlUuid]: control as any,
        }

        return control
    }

    private static generateCallbacks() {
        return this.museCharNames.reduce(
            (acc, name) => ({
                ...acc,
                [MUSE_CHARACTERISTIC_UUIDS[name]]:
                    this.handleEegChannelData.bind(this.instance),
            }),
            {}
        )
    }

    private static get handleEegChannelData() {
        return this.instance.getHandleEegChannelData()
    }

    private static generateExpectedCall(cmd: string) {
        return { data: this.encodeCommand(cmd), withoutResponse: true }
    }

    private static async start() {
        await this.instance.start()
    }

    private static encodeCommand(cmd: string) {
        const encoded = new TextEncoder().encode(`X${cmd}\n`)
        encoded[0] = encoded.length - 1
        return Buffer.from(encoded)
    }

    private static setFakeBleAdapter() {
        BleDeviceAdapter.Class = FakeBleAdapter
        FakeBleAdapter.resetTestDouble()
    }

    private static setFakeBleScanner() {
        BleDeviceScanner.Class = FakeBleScanner
        FakeBleScanner.resetTestDouble()

        FakeBleScanner.fakedPeripherals = [this.peripheral]
    }

    private static setFakeLslOutlet() {
        LslStreamOutlet.Class = FakeLslOutlet
        FakeLslOutlet.resetTestDouble()
    }

    private static setFakeStreamInfo() {
        LslStreamInfo.Class = FakeStreamInfo
        FakeStreamInfo.resetTestDouble()
    }

    private static setSpyMuseStreamGenerator() {
        MuseStreamGenerator.Class = SpyMuseStreamGenerator
    }

    private static get callsToScanForName() {
        return FakeBleScanner.callsToScanForName
    }

    private static get callsToGetCharacteristic() {
        return FakeBleAdapter.callsToGetCharacteristic
    }

    private static readonly bleLocalName = 'MuseS'
    private static readonly controlUuid = MUSE_CHARACTERISTIC_UUIDS.CONTROL
    private static readonly eegSampleRate = 256
    private static readonly eegChunkSize = 12
    private static readonly ppgSampleRate = 64
    private static readonly ppgChunkSize = 6

    private static readonly peripheral = new FakePeripheral({
        localName: this.bleLocalName,
    })

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

    private static readonly museCharNames = [
        ...this.eegCharNames,
        ...this.ppgCharNames,
    ]

    private static readonly eegCharUuids = this.eegCharNames.map(
        (name) => MUSE_CHARACTERISTIC_UUIDS[name]
    )

    private static readonly eegChannelNames = [
        'TP9',
        'AF7',
        'AF8',
        'TP10',
        'AUX',
    ]

    private static readonly eegNumChannels = this.eegChannelNames.length

    private static readonly ppgChannelNames = ['Ambient', 'Infrared', 'Red']

    private static async MuseStreamGenerator() {
        return (await MuseStreamGenerator.Create()) as SpyMuseStreamGenerator
    }
}

class SpyMuseStreamGenerator extends MuseStreamGenerator {
    public constructor(options: StreamGeneratorConstructorOptions) {
        super(options)
    }

    public getHandleEegChannelData() {
        return this.handleEegChannelForChunk
    }
}
