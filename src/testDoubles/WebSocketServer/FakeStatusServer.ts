import WebSocket, { ServerOptions } from 'ws'

export default class FakeStatusServer {
    public static callsToConstructor: (ServerOptions | undefined)[] = []
    public static instances: FakeStatusServer[] = []
    public static numCallsToClose = 0

    public clients = new Set<FakeStatusClient>()
    private connectionListeners: ((client: FakeStatusClient) => void)[] = []

    public constructor(options?: ServerOptions) {
        FakeStatusServer.callsToConstructor.push(options)
        FakeStatusServer.instances.push(this)
    }

    public on(event: string, listener: (client: FakeStatusClient) => void) {
        if (event === 'connection') {
            this.connectionListeners.push(listener)
        }
        return this
    }

    public connect() {
        const client = new FakeStatusClient()
        this.clients.add(client)
        this.connectionListeners.forEach((listener) => listener(client))
        return client
    }

    public close() {
        FakeStatusServer.numCallsToClose++
    }

    public static get latest() {
        return this.instances[this.instances.length - 1]
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.instances = []
        this.numCallsToClose = 0
    }
}

export class FakeStatusClient {
    public readyState: number = WebSocket.OPEN
    public sent: string[] = []

    public send(data: string) {
        this.sent.push(data)
    }

    public get lastMessage() {
        return JSON.parse(this.sent[this.sent.length - 1])
    }
}
