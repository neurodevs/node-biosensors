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
        const a = FakeBleScanner.callsToScanForName
        debugger
        assert.isEqualDeep(
            a,
            ['MuseS'],
            'Should call scanForName on BleDeviceScanner!\n'
        )
    }

    private static setFakeBleScanner() {
        BleDeviceScanner.Class = FakeBleScanner
        FakeBleScanner.resetTestDouble()

        FakeBleScanner.fakedPeripherals = [
            new FakePeripheral({ localName: 'MuseS' }),
        ]
    }

    private static async MuseStreamGenerator() {
        return await MuseStreamGenerator.Create()
    }
}
