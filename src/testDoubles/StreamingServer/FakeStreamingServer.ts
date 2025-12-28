import {
    StreamingServer,
    StreamingServerOptions,
} from '../../impl/BiosensorStreamingServer.js'

export default class FakeStreamingServer implements StreamingServer {
    public static callsToConstructor: (StreamingServerOptions | undefined)[] =
        []

    public static numCallsToStart = 0
    public static numCallsToStop = 0

    public constructor(options?: StreamingServerOptions) {
        FakeStreamingServer.callsToConstructor.push(options)
    }

    public async start() {
        FakeStreamingServer.numCallsToStart += 1
    }

    public async stop() {
        FakeStreamingServer.numCallsToStop += 1
    }

    public static resetTestDouble() {
        FakeStreamingServer.callsToConstructor = []
        FakeStreamingServer.numCallsToStart = 0
        FakeStreamingServer.numCallsToStop = 0
    }
}
