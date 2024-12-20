import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import MuseStreamGenerator from '../components/Muse/MuseStreamGenerator'
import { StreamGenerator } from '../types'

export default class MuseStreamGeneratorTest extends AbstractSpruceTest {
    private static instance: StreamGenerator

    protected static async beforeEach() {
        await super.beforeEach()
        this.instance = this.MuseStreamGenerator()
    }

    @test()
    protected static async canCreateMuseStreamGenerator() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    private static MuseStreamGenerator() {
        return MuseStreamGenerator.Create()
    }
}
