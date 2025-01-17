export default class FakeDeviceFTDI {
    public static callsToSetTimeouts: CallToSetTimeouts[] = []
    public static callsToPurge: number[] = []
    public static callsToSetFlowControl: CallToSetFlowControl[] = []
    public static callsToSetBaudRate: number[] = []

    public setTimeouts(txTimeoutMs: number, rxTimeoutMs: number) {
        FakeDeviceFTDI.callsToSetTimeouts.push({ txTimeoutMs, rxTimeoutMs })
    }

    public purge(mask: number) {
        FakeDeviceFTDI.callsToPurge.push(mask)
    }

    public setFlowControl(flowControl: number, xOn: number, xOff: number) {
        FakeDeviceFTDI.callsToSetFlowControl.push({ flowControl, xOn, xOff })
    }

    public setBaudRate(baudRate: number) {
        FakeDeviceFTDI.callsToSetBaudRate.push(baudRate)
    }

    public static resetTestDouble() {
        FakeDeviceFTDI.callsToSetTimeouts = []
        FakeDeviceFTDI.callsToPurge = []
        FakeDeviceFTDI.callsToSetFlowControl = []
        FakeDeviceFTDI.callsToSetBaudRate = []
    }
}

export interface CallToSetTimeouts {
    txTimeoutMs: number
    rxTimeoutMs: number
}

export interface CallToSetFlowControl {
    flowControl: number
    xOn: number
    xOff: number
}
