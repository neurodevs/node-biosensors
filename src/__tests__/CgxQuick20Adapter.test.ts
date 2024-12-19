import AbstractSpruceTest, {
    test,
    assert,
    generateId,
} from '@sprucelabs/test-utils'
import {
    BleScannerImpl,
    FakeBleScanner,
    SimplePeripheral,
} from '@neurodevs/node-ble-scanner'
import { LslOutletImpl, FakeLslOutlet } from '@neurodevs/node-lsl'
import CgxQuick20Adapter, { BiosensorAdapter } from '../components/CgxQuick20Adapter'

export default class CgxQuick20AdapterTest extends AbstractSpruceTest {
    private static instance: BiosensorAdapter

    protected static async beforeEach() {
        await super.beforeEach()

        BleScannerImpl.Class = FakeBleScanner
        FakeBleScanner.resetTestDouble()

        LslOutletImpl.Class = FakeLslOutlet
        FakeLslOutlet.resetTestDouble()

        this.instance = this.CreateFromPeripheral()
    }

    @test()
    protected static async canCreateCgxQuick20Adapter() {
        assert.isTruthy(this.instance)
    }

    @test()
    protected static async createFromPeripheralDoesNotCreateBleScanner() {
        assert.isEqual(FakeBleScanner.numCallsToConstructor, 0)
    }

    @test()
    protected static async createFromUuidCreatesBleScanner() {
        await this.CreateFromUuid(generateId())

        assert.isEqual(FakeBleScanner.numCallsToConstructor, 1)
    }

    @test()
    protected static async doesNotCreateBleScannerIfPeripheralPassed() {
        FakeBleScanner.resetTestDouble()
        await this.CreateFromPeripheral({} as SimplePeripheral)

        assert.isEqual(FakeBleScanner.numCallsToConstructor, 0)
    }

    @test()
    protected static async createsLslOutletForEegStream() {
        assert.isEqualDeep(
            FakeLslOutlet.constructorOptions,
            this.eegConstructorOptions
        )
    }

    @test()
    protected static async createsCgxAdapterFromUuid() {
        const uuid = generateId()
        const instance = await this.CreateFromUuid(uuid)
        assert.isTruthy(instance)
    }

    @test()
    protected static async createCgxAdapterFromCreateWithNoArgs() {
        const instance = await this.Create()
        assert.isTruthy(instance)
    }

    private static readonly channelNames: string[] = ['tmp']

    private static readonly eegConstructorOptions = {
        name: 'CGX Quick20 EEG Stream',
        type: 'EEG',
        channelNames: this.channelNames,
        sampleRate: 256,
        channelFormat: 'float32',
        sourceId: 'cgx-quick20-eeg',
        manufacturer: 'CGX Systems Cognionics',
        unit: 'microvolt',
        chunkSize: 20,
        maxBuffered: 360,
    }

    private static async CreateFromPeripheral(peripheral?: SimplePeripheral) {
        return await CgxQuick20Adapter.CreateFromBle(
            peripheral ?? ({} as SimplePeripheral)
        )
    }

    private static async CreateFromUuid(uuid: string) {
        return await CgxQuick20Adapter.CreateFromUuid(uuid)
    }

    private static async Create() {
        return await CgxQuick20Adapter.Create()
    }
}
