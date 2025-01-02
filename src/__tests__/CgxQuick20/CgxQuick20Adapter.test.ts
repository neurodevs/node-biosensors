import { test, assert, generateId } from '@sprucelabs/test-utils'
import {
    BleAdapter,
    BleDeviceAdapter,
    BleDeviceScanner,
    FakeBleAdapter,
    FakeBleScanner,
    FakePeripheral,
} from '@neurodevs/node-ble'
import {
    LslStreamOutlet,
    FakeLslOutlet,
    LslStreamInfo,
    FakeStreamInfo,
} from '@neurodevs/node-lsl'
import CgxQuick20Adapter, {
    BiosensorAdapter,
} from '../../components/CgxQuick20/CgxQuick20Adapter'
import AbstractBiosensorsTest from '../AbstractBiosensorsTest'

export default class CgxQuick20AdapterTest extends AbstractBiosensorsTest {
    private static instance: BiosensorAdapter

    protected static async beforeEach() {
        await super.beforeEach()

        BleDeviceAdapter.Class = FakeBleAdapter
        FakeBleAdapter.resetTestDouble()

        BleDeviceScanner.Class = FakeBleScanner
        FakeBleScanner.resetTestDouble()

        LslStreamOutlet.Class = FakeLslOutlet
        FakeLslOutlet.resetTestDouble()

        LslStreamInfo.Class = FakeStreamInfo
        FakeStreamInfo.resetTestDouble()

        this.instance = this.CreateFromBle()
    }

    @test()
    protected static async canCreateCgxQuick20Adapter() {
        assert.isTruthy(this.instance)
    }

    @test()
    protected static async createFromPeripheralDoesNotCreateBleScanner() {
        assert.isEqual(FakeBleScanner.callsToConstructor.length, 0)
    }

    @test()
    protected static async createFromUuidCreatesBleScanner() {
        await this.CreateFromUuid(generateId())

        assert.isEqual(FakeBleScanner.callsToConstructor.length, 1)
    }

    @test()
    protected static async doesNotCreateBleScannerIfPeripheralPassed() {
        FakeBleScanner.resetTestDouble()
        await this.CreateFromBle(this.FakeBleAdapter())

        assert.isEqual(FakeBleScanner.callsToConstructor.length, 0)
    }

    @test()
    protected static async createsLslOutletForEegStream() {
        assert.isEqualDeep(
            FakeLslOutlet.callsToConstructor[0].options,
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
        FakeBleScanner.fakedPeripherals = [
            new FakePeripheral({ localName: 'CGX Quick-Series Headset' }),
        ]
        const instance = await this.CgxQuick20Adapter()
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

    private static async CreateFromBle(adapter?: BleAdapter) {
        return await CgxQuick20Adapter.CreateFromBle(
            adapter ?? this.FakeBleAdapter()
        )
    }

    private static async CreateFromUuid(uuid: string) {
        FakeBleScanner.setFakedPeripherals([uuid])
        return await CgxQuick20Adapter.CreateFromUuid(uuid)
    }

    private static FakeBleAdapter() {
        return new FakeBleAdapter()
    }

    private static async CgxQuick20Adapter() {
        return await CgxQuick20Adapter.Create()
    }
}
