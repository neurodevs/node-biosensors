import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import {
    BleScannerImpl,
    FakeBleScanner,
    SimplePeripheral,
} from '@neurodevs/node-ble-scanner'
import { LslOutletImpl, FakeLslOutlet } from '@neurodevs/node-lsl'
import CgxQuick20Adapter, { BiosensorAdapter } from '../../CgxQuick20Adapter'

export default class CgxQuick20AdapterTest extends AbstractSpruceTest {
    private static instance: BiosensorAdapter

    protected static async beforeEach() {
        await super.beforeEach()

        BleScannerImpl.Class = FakeBleScanner
        FakeBleScanner.resetTestDouble()

        LslOutletImpl.Class = FakeLslOutlet
        FakeLslOutlet.resetTestDouble()

        this.instance = this.CgxQuick20Adapter()
    }

    @test()
    protected static async canCreateCgxQuick20Adapter() {
        assert.isTruthy(this.instance)
    }

    @test()
    protected static async createsBleScanner() {
        assert.isEqual(FakeBleScanner.numCallsToConstructor, 1)
    }

    @test()
    protected static async doesNotCreateBleScannerIfPeripheralPassed() {
        FakeBleScanner.resetTestDouble()
        await this.CgxQuick20Adapter({} as SimplePeripheral)

        assert.isEqual(FakeBleScanner.numCallsToConstructor, 0)
    }

    @test()
    protected static async createsLslOutletForEegStream() {
        assert.isEqualDeep(
            FakeLslOutlet.constructorOptions,
            this.eegConstructorOptions
        )
    }

    private static readonly channelNames: string[] = []

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

    private static async CgxQuick20Adapter(peripheral?: SimplePeripheral) {
        return await CgxQuick20Adapter.Create(peripheral)
    }
}
