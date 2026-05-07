import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Bell, XCircle, AlertTriangle, CheckCircle } from 'lucide-react';

const CFG = {
  Critical: { cls:'al-critical', icon:XCircle,       badge:'b-critical', btnBg:'#b91c1c' },
  High:     { cls:'al-high',     icon:AlertTriangle,  badge:'b-high',     btnBg:'#c2410c' },
  Medium:   { cls:'al-medium',   icon:AlertTriangle,  badge:'b-medium',   btnBg:'#a16207' },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [busy,   setBusy]   = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/inventory/alerts').then(r => setAlerts(r.data.data)).finally(() => setBusy(false));
  }, []);

  const counts   = { Critical:0, High:0, Medium:0 };
  alerts.forEach(a => { if (counts[a.level] !== undefined) counts[a.level]++; });
  const displayed = filter ? alerts.filter(a => a.level === filter) : alerts;

  return (
    <div>
      <div className="ph">
        <h1 style={{display:'flex',alignItems:'center',gap:10}}><Bell size={21}/> Stock Alerts</h1>
        <p>{alerts.length} active alerts requiring attention</p>
      </div>

      {/* Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22}}>
        {['Critical','High','Medium'].map(lvl => {
          const cfg = CFG[lvl];
          const Icon = cfg.icon;
          return (
            <div key={lvl} className="card" style={{padding:18,cursor:'pointer',border:`2px solid ${filter===lvl?cfg.btnBg:'transparent'}`,transition:'all .15s'}}
              onClick={() => setFilter(filter===lvl?'':lvl)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:30,fontWeight:800,color:cfg.btnBg}}>{counts[lvl]}</div>
                  <div style={{fontSize:13.5,fontWeight:600,color:cfg.btnBg}}>{lvl} Alerts</div>
                </div>
                <Icon size={34} color={cfg.btnBg} style={{opacity:.3}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert List */}
      {busy ? <div className="loader"><span className="spinner"/></div>
        : displayed.length === 0 ? (
          <div className="card"><div className="empty" style={{padding:60}}><CheckCircle size={52} style={{opacity:.25}}/><h3>{filter?`No ${filter} alerts`:'All stock levels are healthy!'}</h3></div></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {displayed.map((alert, i) => {
              const cfg  = CFG[alert.level] || CFG.Medium;
              const Icon = cfg.icon;
              const s    = alert.stock;
              const p    = alert.product;
              const fill = Math.min(100, (s.onHand / Math.max(1, p.reorderPoint * 2)) * 100);
              return (
                <div key={i} className={`card alert-strip ${cfg.cls}`} style={{padding:18}}>
                  <Icon size={20} style={{flexShrink:0,marginTop:3}}/>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:15}}>{p.name}</div>
                        <div style={{fontSize:13,opacity:.85,marginTop:2}}>{alert.message}</div>
                        <div style={{display:'flex',gap:18,marginTop:10,fontSize:13,flexWrap:'wrap'}}>
                          <span><strong>SKU:</strong> {p.skuCode}</span>
                          <span><strong>On Hand:</strong> <strong>{s.onHand}</strong></span>
                          <span><strong>Safety Stock:</strong> {p.safetyStock}</span>
                          <span><strong>ROP:</strong> {p.reorderPoint}</span>
                          <span><strong>EOQ:</strong> {p.economicOrderQty}</span>
                        </div>
                        <div style={{marginTop:10,width:200}}>
                          <div style={{fontSize:11,fontWeight:600,marginBottom:3}}>Stock Level</div>
                          <div className="sbar"><div className="sbar-fill" style={{width:`${fill}%`,background:cfg.btnBg}}/></div>
                          <div style={{fontSize:11,marginTop:3}}>{s.onHand} / {p.reorderPoint*2} units</div>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:8,flexShrink:0}}>
                        <span className={`badge ${cfg.badge}`}>{alert.level}</span>
                        <Link to="/purchase-orders" className="btn btn-sm" style={{background:cfg.btnBg,color:'#fff'}}>Create PO</Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
