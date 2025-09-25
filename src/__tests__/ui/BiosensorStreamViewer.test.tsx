import { test, assert } from '@sprucelabs/test-utils'
import { render, RenderResult } from '@testing-library/react'
import BiosensorStreamViewer from '../../ui/BiosensorStreamViewer'
import AbstractPackageTest from '../AbstractPackageTest'

export default class BiosensorStreamViewerTest extends AbstractPackageTest {
    private static result: RenderResult

    protected static async beforeEach() {
        await super.beforeEach()

        this.result = this.render()
    }

    @test()
    protected static async rendersComponent() {
        assert.isTruthy(this.result, 'Failed to render component!')
    }

    @test()
    protected static async rendersTopLevelDivWithExpectedClass() {
        assert.isEqual(
            this.div.className,
            this.className,
            'Top-level div has incorrect class!'
        )
    }

    private static get div() {
        return this.getByTestId(this.className)
    }

    private static get getByTestId() {
        return this.result.getByTestId
    }

    private static readonly className = 'biosensor-stream-viewer'

    protected static render() {
        return render(<BiosensorStreamViewer />)
    }
}
