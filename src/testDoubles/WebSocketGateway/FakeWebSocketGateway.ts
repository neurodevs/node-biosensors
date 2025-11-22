import { StreamTransportBridge } from '@neurodevs/node-lsl'
import { WebSocketGateway } from '../../impl/BiosensorWebSocketGateway.js'

export default class FakeWebSocketGateway implements WebSocketGateway {
    public static callsToConstructor: (StreamTransportBridge[] | undefined)[] =
        []

    public static numCallsToOpen = 0
    public static numCallsToClose = 0
    public static numCallsToDestroy = 0

    public constructor(bridges?: StreamTransportBridge[] | undefined) {
        FakeWebSocketGateway.callsToConstructor.push(bridges ?? [])
    }

    public open() {
        FakeWebSocketGateway.numCallsToOpen++
    }

    public close() {
        FakeWebSocketGateway.numCallsToClose++
    }

    public destroy() {
        FakeWebSocketGateway.numCallsToDestroy++
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToOpen = 0
        this.numCallsToClose = 0
        this.numCallsToDestroy = 0
    }
}
