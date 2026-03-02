import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../../store/app'
import { api } from '../../api'

export default function DeployModal({ onClose }: { onClose: () => void }) {
  const { addToast } = useAppStore()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [image, setImage] = useState('')
  const [hostPort, setHostPort] = useState('')
  const [containerPort, setContainerPort] = useState('')
  const [env, setEnv] = useState('')
  const [restart, setRestart] = useState('no')

  const createMut = useMutation({
    mutationFn: () => api.containers.create({
      name, image,
      ports: hostPort && containerPort ? [{ host_port: hostPort, container_port: containerPort, protocol: 'tcp' }] : [],
      env: env.split('\n').filter(Boolean),
      restart_policy: restart,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['containers'] })
      addToast(`Container ${name} created`, 'success')
      onClose()
    },
    onError: (e: Error) => addToast(e.message, 'error'),
  })

  return (
    <div className="modal-overlay open" onClick={e => (e.target as HTMLElement).classList.contains('modal-overlay') && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Deploy container</div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Container name <span style={{color:'var(--accent-red)'}}>*</span></label>
            <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="my-app" />
          </div>
          <div className="form-group">
            <label className="form-label">Image <span style={{color:'var(--accent-red)'}}>*</span></label>
            <input className="form-input" type="text" value={image} onChange={e => setImage(e.target.value)} placeholder="nginx:latest" />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="form-group">
              <label className="form-label">Host port</label>
              <input className="form-input" type="text" value={hostPort} onChange={e => setHostPort(e.target.value)} placeholder="8080" />
            </div>
            <div className="form-group">
              <label className="form-label">Container port</label>
              <input className="form-input" type="text" value={containerPort} onChange={e => setContainerPort(e.target.value)} placeholder="80" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Environment variables</label>
            <textarea className="form-input" rows={3} value={env} onChange={e => setEnv(e.target.value)} placeholder="KEY=value&#10;NODE_ENV=production" style={{resize:'vertical'}} />
          </div>
          <div className="form-group">
            <label className="form-label">Restart policy</label>
            <select className="form-input" value={restart} onChange={e => setRestart(e.target.value)}>
              <option value="no">No</option>
              <option value="always">Always</option>
              <option value="on-failure">On failure</option>
              <option value="unless-stopped">Unless stopped</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => createMut.mutate()} disabled={!name || !image || createMut.isPending}>
            {createMut.isPending ? 'Deploying…' : 'Deploy'}
          </button>
        </div>
      </div>
    </div>
  )
}