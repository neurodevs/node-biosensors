import { test, assert } from '@sprucelabs/test-utils'
import EmpaticaE4Adapter, {
    E4Adapter,
} from '../../components/Empatica/EmpaticaE4Adapter'
import AbstractBiosensorsTest from '../AbstractBiosensorsTest'

export default class EmpaticaE4AdapterTest extends AbstractBiosensorsTest {
    private static instance: E4Adapter

    protected static async beforeEach() {
        await super.beforeEach()
        this.instance = this.EmpaticaE4Adapter()
    }

    @test()
    protected static async createsE4AdapterInstance() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    private static EmpaticaE4Adapter() {
        return EmpaticaE4Adapter.Create()
    }
}
