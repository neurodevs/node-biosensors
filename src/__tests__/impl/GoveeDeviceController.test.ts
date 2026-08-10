import { test, assert } from '@neurodevs/node-tdd'

import GoveeDeviceController from '../../impl/govee/GoveeDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import { FakeBleObserver } from '@neurodevs/node-lsl'
import { DeviceControllerBle } from '../../impl/BiosensorDeviceFactory.js'

export default class GoveeDeviceControllerTest extends AbstractPackageTest {
    private static instance: DeviceControllerBle

    private static readonly goveeDeviceUuid = this.generateId()

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.GoveeDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsBleObserverController() {
        assert.isEqualDeep(FakeBleObserver.callsToConstructor[0], {
            deviceUuid: this.goveeDeviceUuid,
        })
    }

    @test()
    protected static async connectCallsStartObservingOnBleObserver() {
        await this.instance.connect()

        assert.isEqual(
            FakeBleObserver.numCallsToStartObserving,
            1,
            'Did not call startObserving on the BleObserver!'
        )
    }

    private static GoveeDeviceController() {
        return GoveeDeviceController.Create({
            deviceUuid: this.goveeDeviceUuid,
        })
    }
}
