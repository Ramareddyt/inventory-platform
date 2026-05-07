import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../../utils/api';

const TITLES = {
  '/':'Dashboard','/products':'Products & SKUs','/inventory':'Inventory Management',
  '/suppliers':'Supplier Management','/purchase-orders':'Purchase Orders',
  '/analytics':'Analytics & Forecast','/alerts':'Stock Alerts',
};

export default function Header() {
  const { pathname } = useLocation();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    api.get('/inventory/alerts').then(r => setAlertCount(r.data.count)).catch(() => {});
  }, [pathname]);

  return (
    <header style={{ position:'fixed', top:0, left:'var(--sidebar)', right:0, height:'var(--header)', background:'#fff', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', zIndex:99 }}>
      <div>
        <h2 style={{ fontSize:16, fontWeight:700, color:'#0f172a' }}>{TITLES[pathname] || 'InvenIQ'}</h2>
        <p style={{ fontSize:11.5, color:'#94a3b8', marginTop:1 }}>
          {new Date().toLocaleDateString('en-IN',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>
      <Link to="/alerts" style={{ position:'relative', padding:8, borderRadius:8, display:'flex', alignItems:'center', color:'#475569', textDecoration:'none' }}>
        <Bell size={19} />
        {alertCount > 0 && (
          <span style={{ position:'absolute', top:4, right:4, background:'#ef4444', color:'#fff', fontSize:9.5, fontWeight:700, width:15, height:15, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </Link>
    </header>
  );
}
