import { test, assert } from '@neurodevs/node-tdd'

import { DeviceName } from '../../impl/BiosensorDeviceFactory.js'
import BiosensorRuntimeOrchestrator, {
    RuntimeOrchestrator,
} from '../../impl/BiosensorRuntimeOrchestrator.js'
import FakeDeviceFactory from '../../testDoubles/DeviceFactory/FakeDeviceFactory.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class BiosensorRuntimeOrchestratorTest extends AbstractPackageTest {
    private static instance: RuntimeOrchestrator

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeDeviceFactory()

        this.instance = await this.BiosensorRuntimeOrchestrator()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsBiosensorDeviceFactory() {
        assert.isEqual(
            FakeDeviceFactory.numCallsToConstructor,
            1,
            'Did not create device factory!'
        )
    }

    private static readonly deviceNames: DeviceName[] = [
        'Cognionics Quick-20r',
        'Muse S Gen 2',
        'Zephyr BioHarness 3',
    ]

    private static async BiosensorRuntimeOrchestrator() {
        return await BiosensorRuntimeOrchestrator.Create({
            deviceNames: this.deviceNames,
        })
    }
}
