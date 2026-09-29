import { DeviceState, DeviceStateListener } from '../types.js'

export default class DeviceStateEmitter implements StateEmitter {
    private currentState: DeviceState = 'disconnected'
    private readonly listeners = new Set<DeviceStateListener>()

    public get state() {
        return this.currentState
    }

    public setState(state: DeviceState) {
        if (state === this.currentState) {
            return
        }

        this.currentState = state
        this.listeners.forEach((listener) => listener(state))
    }

    public addStateListener(listener: DeviceStateListener) {
        this.listeners.add(listener)
        return () => {
            this.listeners.delete(listener)
        }
    }
}

export interface StateEmitter {
    readonly state: DeviceState
    setState(state: DeviceState): void
    addStateListener(listener: DeviceStateListener): () => void
}
