export let passedFakeStreamViewerProps: any[] = []

export function resetFakeStreamViewer() {
    passedFakeStreamViewerProps = []
}

const FakeStreamViewer: React.FC = () => {
    passedFakeStreamViewerProps.push({})
    return <div data-testid="fake-stream-viewer"></div>
}

export default FakeStreamViewer
