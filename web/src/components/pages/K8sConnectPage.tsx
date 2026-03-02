export default function K8sConnectPage() {
  return (
    <div className="page active" id="page-k8s-connect">
      <div className="k8s-connect-screen">
        <div className="k8s-connect-orb">⎈</div>
        <h2 className="k8s-connect-title">Connect a Kubernetes cluster</h2>
        <p className="k8s-connect-sub">
          OrcaHub didn't find a Kubernetes context on this host. Make sure kubectl
          is configured and your cluster is reachable.
        </p>
        <div style={{display:'flex',gap:12,marginTop:24,justifyContent:'center'}}>
          <a href="https://kubernetes.io/docs/tasks/tools/" target="_blank" rel="noreferrer"
            className="btn btn-ghost btn-sm">Setup kubectl</a>
          <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>
            Retry detection
          </button>
        </div>
      </div>
    </div>
  )
}