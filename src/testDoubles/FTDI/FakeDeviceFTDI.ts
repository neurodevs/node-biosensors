export default class FakeDeviceFTDI {
    public static callsToSetTimeouts: CallToSetTimeouts[] = []

    public setTimeouts(txTimeoutMs: number, rxTimeoutMs: number) {
        FakeDeviceFTDI.callsToSetTimeouts.push({ txTimeoutMs, rxTimeoutMs })
    }

    public static resetTestDouble() {
        FakeDeviceFTDI.callsToSetTimeouts = []
    }
}

export interface CallToSetTimeouts {
    txTimeoutMs: number
    rxTimeoutMs: number
}
