import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import {
    BleDeviceAdapter,
    BleDeviceScanner,
    FakeBleAdapter,
    FakeBleScanner,
    FakeCharacteristic,
    FakePeripheral,
} from '@neurodevs/node-ble'
import { MUSE_CHARACTERISTIC_UUIDS } from '../../components/MuseSGen2/museCharacteristicUuids'
import MuseStreamGenerator, {
    StreamGenerator,
} from '../../components/MuseSGen2/MuseStreamGenerator'

export default class MuseStreamGeneratorTest extends AbstractSpruceTest {
    private static instance: StreamGenerator

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeBleAdapter()
        this.setFakeBleScanner()

        this.instance = await this.MuseStreamGenerator()
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
            Object.keys(this.museCharacteristicCallbacks),
            'Should call scanForName with the correct options!'
        )
    }

    @test()
    protected static async startCallsGetCharacteristicForControlUuid() {
        this.createFakeCharacteristic()

        await this.start()

        assert.isEqual(
            this.callsToGetCharacteristic[0],
            MUSE_CHARACTERISTIC_UUIDS.CONTROL
        )
    }

    @test()
    protected static async startWritesControlCommands() {
        const fake = this.createFakeCharacteristic()

        await this.start()

        assert.isEqualDeep(
            fake.callsToWriteAsync,
            [
                this.generateExpectedCall('h'),
                this.generateExpectedCall('p50'),
                this.generateExpectedCall('s'),
                this.generateExpectedCall('d'),
            ],
            'Should write to the control characteristic!'
        )
    }

    private static createFakeCharacteristic() {
        const fake = new FakeCharacteristic({
            uuid: this.controlUuid,
        })

        FakeBleAdapter.fakeCharacteristics = { [this.controlUuid]: fake as any }
        return fake
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

        FakeBleScanner.fakedPeripherals = [
            new FakePeripheral({
                localName: this.museBleLocalName,
            }),
        ]
    }

    private static get callsToScanForName() {
        return FakeBleScanner.callsToScanForName
    }

    private static get callsToGetCharacteristic() {
        return FakeBleAdapter.callsToGetCharacteristic
    }

    private static readonly museBleLocalName = 'MuseS'

    private static readonly museCharacteristicNames = [
        'EEG_TP9',
        'EEG_AF7',
        'EEG_AF8',
        'EEG_TP10',
        'EEG_AUX',
        'PPG_AMBIENT',
        'PPG_INFRARED',
        'PPG_RED',
    ]

    private static readonly controlUuid = MUSE_CHARACTERISTIC_UUIDS.CONTROL

    private static readonly museCharacteristicCallbacks =
        this.generateCallbacks()

    private static generateCallbacks() {
        return this.museCharacteristicNames.reduce(
            (acc, name) => ({
                ...acc,
                [MUSE_CHARACTERISTIC_UUIDS[name]]: () => {},
            }),
            {}
        )
    }

    private static async MuseStreamGenerator() {
        return await MuseStreamGenerator.Create()
    }
}
