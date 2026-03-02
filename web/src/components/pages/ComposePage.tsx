import { useAppStore } from '../../store/app'

export default function ComposePage() {
  const { addToast } = useAppStore()
  return (
    <div className="page active" id="page-compose">
      <div className="ph">
        <div className="ph-left"><h1>Compose</h1><p>Docker Compose stacks and multi-container apps</p></div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={() => addToast('Compose deploy coming soon', 'info')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Deploy stack
          </button>
        </div>
      </div>
      <div className="k8s-placeholder" style={{marginTop:24}}>
        <div className="k8s-ph-visual">🐙</div>
        <div className="k8s-ph-body">
          <h2>Docker Compose management</h2>
          <p>Detect, manage, and deploy Docker Compose stacks directly from OrcaHub. Upload a compose file or connect to an existing stack.</p>
          <div className="k8s-ph-chips">
            <span className="k8s-ph-chip">Stack detection</span>
            <span className="k8s-ph-chip">Scale services</span>
            <span className="k8s-ph-chip">Live logs</span>
            <span className="k8s-ph-chip">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}