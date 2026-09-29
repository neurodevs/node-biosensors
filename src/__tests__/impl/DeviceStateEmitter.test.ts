import { test, assert } from '@neurodevs/node-tdd'

import DeviceStateEmitter, {
    StateEmitter,
} from '../../impl/DeviceStateEmitter.js'
import { DeviceState } from '../../types.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class DeviceStateEmitterTest extends AbstractPackageTest {
    private static instance: StateEmitter
    private static receivedStates: DeviceState[] = []

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = new DeviceStateEmitter()
        this.receivedStates = []
    }

    @test()
    protected static async startsDisconnected() {
        assert.isEqual(
            this.instance.state,
            'disconnected',
            'Did not start disconnected!'
        )
    }

    @test()
    protected static async updatesState() {
        this.instance.setState('connecting')

        assert.isEqual(
            this.instance.state,
            'connecting',
            'Did not update state!'
        )
    }

    @test()
    protected static async notifiesListenersOfEachChange() {
        this.listen()

        this.instance.setState('connecting')
        this.instance.setState('connected')

        assert.isEqualDeep(
            this.receivedStates,
            ['connecting', 'connected'],
            'Did not notify listeners of each change!'
        )
    }

    @test()
    protected static async doesNotNotifyWhenStateIsUnchanged() {
        this.listen()

        this.instance.setState('disconnected')

        assert.isEqualDeep(
            this.receivedStates,
            [],
            'Notified listeners without a state change!'
        )
    }

    @test()
    protected static async stopsNotifyingAfterUnsubscribe() {
        const unsubscribe = this.listen()

        unsubscribe()
        this.instance.setState('connecting')

        assert.isEqualDeep(
            this.receivedStates,
            [],
            'Notified listener after unsubscribing!'
        )
    }

    private static listen() {
        return this.instance.addStateListener((state) =>
            this.receivedStates.push(state)
        )
    }
}
