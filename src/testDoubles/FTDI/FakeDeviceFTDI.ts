export default class FakeDeviceFTDI {
    public static callsToSetTimeouts: CallToSetTimeouts[] = []
    public static callsToPurge: number[] = []
    public static callsToSetFlowControl: CallToSetFlowControl[] = []
    public static callsToSetBaudRate: number[] = []
    public static callsToSetDataCharacteristics: CallToSetDataChars[] = []
    public static callsToSetLatencyTimer: number[] = []
    public static callsToRead: number[] = []

    public static fakeReadData?: Uint8Array

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

    public setDataCharacteristics(
        dataBits: number,
        stopBits: number,
        parity: number
    ) {
        FakeDeviceFTDI.callsToSetDataCharacteristics.push({
            dataBits,
            stopBits,
            parity,
        })
    }

    public setLatencyTimer(latencyTimerMs: number) {
        FakeDeviceFTDI.callsToSetLatencyTimer.push(latencyTimerMs)
    }

    public async read(numBytes: number) {
        FakeDeviceFTDI.callsToRead.push(numBytes)
        return FakeDeviceFTDI.fakeReadData ?? new Uint8Array(numBytes)
    }

    public static resetTestDouble() {
        FakeDeviceFTDI.callsToSetTimeouts = []
        FakeDeviceFTDI.callsToPurge = []
        FakeDeviceFTDI.callsToSetFlowControl = []
        FakeDeviceFTDI.callsToSetBaudRate = []
        FakeDeviceFTDI.callsToSetDataCharacteristics = []
        FakeDeviceFTDI.callsToSetLatencyTimer = []
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

export interface CallToSetDataChars {
    dataBits: number
    stopBits: number
    parity: number
}
