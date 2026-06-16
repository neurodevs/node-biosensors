import { assert } from '@neurodevs/node-tdd'

import { FakeBleController } from '@neurodevs/node-lsl'
import AbstractDeviceControllerTest from './AbstractDeviceControllerTest.js'

export default abstract class AbstractDeviceControllerBleTest extends AbstractDeviceControllerTest {

    protected static async assertConnectCallsBleControllerConnect() {
        await this.connect()

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            1,
            'Did not connect to BLE device!'
        )
    }

    protected static async assertConnectDoesNotCallBleControllerIfConnected() {
        await this.connect()
        await this.connect()

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            1,
            'Should only connect to BLE device once!'
        )
    }

    protected static async assertDisconnectCallsDisconnectBle() {
        await this.connect()
        await this.disconnect()

        assert.isEqual(
            FakeBleController.numCallsToDisconnect,
            1,
            'Did not disconnect from BLE device!'
        )
    }

    protected static async assertDisconnectDoesNotCallBleControllerIfNotConnected() {
        await this.disconnect()

        assert.isEqual(
            FakeBleController.numCallsToDisconnect,
            0,
            'Should not disconnect from BLE device if not connected!'
        )
    }

}
