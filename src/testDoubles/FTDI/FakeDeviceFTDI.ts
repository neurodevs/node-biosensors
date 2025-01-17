export default class FakeDeviceFTDI {
    public static callsToSetTimeouts: CallToSetTimeouts[] = []
    public static callsToPurge: number[] = []

    public setTimeouts(txTimeoutMs: number, rxTimeoutMs: number) {
        FakeDeviceFTDI.callsToSetTimeouts.push({ txTimeoutMs, rxTimeoutMs })
    }

    public purge(mask: number) {
        FakeDeviceFTDI.callsToPurge.push(mask)
    }

    public static resetTestDouble() {
        FakeDeviceFTDI.callsToSetTimeouts = []
        FakeDeviceFTDI.callsToPurge = []
    }
}

export interface CallToSetTimeouts {
    txTimeoutMs: number
    rxTimeoutMs: number
}
