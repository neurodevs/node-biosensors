import { BleGatt, BleGattController } from '@neurodevs/node-lsl'

import AbstractDeviceController from './AbstractDeviceController.js'
import { DeviceControllerBleConstructorOptions } from '../../types.js'

export default abstract class AbstractDeviceControllerBle extends AbstractDeviceController {
    protected readonly ble: BleGatt

    private wasStreamingBeforeLoss = false

    protected constructor(options: DeviceControllerBleConstructorOptions) {
        const { bleOptions, ...rest } = options
        super(rest)

        this.ble = BleGattController.Create({
            ...bleOptions,
            onLost: () => this.handleConnectionLost(),
            onReconnect: () => void this.handleReconnected(),
        })
    }

    private handleConnectionLost() {
        this.wasStreamingBeforeLoss = this.state === 'streaming'
        this.setState('reconnecting')
    }

    private async handleReconnected() {
        if (this.state !== 'reconnecting') {
            return
        }

        if (this.wasStreamingBeforeLoss) {
            await this.handleStartStreaming()
            this.setState('streaming')
        } else {
            this.setState('connected')
        }
    }

    protected async handleConnect() {
        await this.ble.connect()
    }

    protected async handleDisconnect() {
        await this.ble.disconnect()
    }

    public get bleUuid() {
        return this.ble.uuid
    }

    public get identifier() {
        return this.ble.uuid
    }

    public get bleName() {
        return this.ble.name
    }
}
