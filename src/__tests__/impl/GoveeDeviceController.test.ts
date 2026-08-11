import { test, assert } from '@neurodevs/node-tdd'

import GoveeDeviceController from '../../impl/govee/GoveeDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import { FakeBleObserver } from '@neurodevs/node-lsl'
import { DeviceControllerBle } from '../../impl/BiosensorDeviceFactory.js'

export default class GoveeDeviceControllerTest extends AbstractPackageTest {
    private static instance: DeviceControllerBle
    private static lastLog: string

    private static readonly goveeDeviceUuid = this.generateId()

    private static readonly advertisement = Buffer.from(
        '88ec00ee08f4176402',
        'hex'
    )
    private static readonly timestampSec = 2650540.252988708

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLog()

        this.instance = this.GoveeDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsBleObserverController() {
        const { deviceUuid } = FakeBleObserver.callsToConstructor[0] ?? {}

        assert.isEqualDeep(
            { deviceUuid },
            { deviceUuid: this.goveeDeviceUuid },
            'Did not create a BleObserverController with the device uuid!'
        )
    }

    @test()
    protected static async passesOnAdvertisementToBleObserver() {
        const { onAdvertisement } = FakeBleObserver.callsToConstructor[0] ?? {}

        assert.isFunction(
            onAdvertisement,
            'Did not pass an onAdvertisement callback to the BleObserver!'
        )
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

    @test()
    protected static async disconnectCallsStopObservingOnBleObserver() {
        await this.instance.connect()
        await this.instance.disconnect()

        assert.isEqual(
            FakeBleObserver.numCallsToStopObserving,
            1,
            'Did not call stopObserving on the BleObserver!'
        )
    }

    @test()
    protected static async onAdvertisementLogsPacket() {
        this.onAdvertisement(
            this.advertisement,
            this.advertisement.length,
            this.timestampSec
        )

        assert.isEqual(
            this.lastLog,
            `[${this.timestampSec}] 88ec00ee08f4176402 ${this.advertisement.length}`,
            'Did not log the advertisement as expected!'
        )
    }

    private static get onAdvertisement() {
        const { onAdvertisement } = FakeBleObserver.callsToConstructor[0] ?? {}
        return onAdvertisement!
    }

    private static setFakeLog() {
        GoveeDeviceController.log = {
            info: (msg: string) => {
                this.lastLog = msg
            },
        } as Console
    }

    private static GoveeDeviceController() {
        return GoveeDeviceController.Create({
            deviceUuid: this.goveeDeviceUuid,
        })
    }
}
