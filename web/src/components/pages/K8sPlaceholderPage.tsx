export default function K8sPlaceholderPage({ title, sub, icon }: { title: string; sub: string; icon: string }) {
  return (
    <div className="page active">
      <div className="ph"><div className="ph-left"><h1>{title}</h1><p>{sub}</p></div></div>
      <div className="k8s-placeholder">
        <div className="k8s-ph-visual">{icon}</div>
        <div className="k8s-ph-body">
          <h2>{title}</h2>
          <p>Full {title.toLowerCase()} management coming in the next release. Kubernetes support is actively being developed.</p>
          <div className="k8s-ph-chips">
            <span className="k8s-ph-chip">Coming Soon</span>
            <span className="k8s-ph-chip">Under Development</span>
          </div>
        </div>
      </div>
    </div>
  )
}