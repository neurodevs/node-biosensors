import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import {
    BleDeviceScanner,
    FakeBleScanner,
    FakePeripheral,
} from '@neurodevs/node-ble'
import MuseStreamGenerator, {
    StreamGenerator,
} from '../../components/MuseSGen2/MuseStreamGenerator'

export default class MuseStreamGeneratorTest extends AbstractSpruceTest {
    private static instance: StreamGenerator

    protected static async beforeEach() {
        await super.beforeEach()

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

    private static readonly museBleLocalName = 'MuseS'

    private static readonly museCharacteristicCallbacks = {
        EEG_TP9: () => {},
        EEG_AF7: () => {},
        EEG_AF8: () => {},
        EEG_TP10: () => {},
        EEG_AUX: () => {},
    }

    private static async MuseStreamGenerator() {
        return await MuseStreamGenerator.Create()
    }
}
