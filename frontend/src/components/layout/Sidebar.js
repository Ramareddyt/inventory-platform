import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Warehouse, Truck, ShoppingCart, BarChart2, Bell, LogOut, Zap } from 'lucide-react';

const NAV = [
  { to:'/',               icon:LayoutDashboard, label:'Dashboard',       exact:true },
  { to:'/products',       icon:Package,         label:'Products & SKUs' },
  { to:'/inventory',      icon:Warehouse,       label:'Inventory'        },
  { to:'/suppliers',      icon:Truck,           label:'Suppliers'        },
  { to:'/purchase-orders',icon:ShoppingCart,    label:'Purchase Orders'  },
  { divider:'Analytics' },
  { to:'/analytics',      icon:BarChart2,       label:'Analytics & Forecast' },
  { to:'/alerts',         icon:Bell,            label:'Stock Alerts'     },
];

const ROLE_COL = {
  admin:'#4f46e5', inventory_manager:'#10b981',
  warehouse_operator:'#f59e0b', procurement_officer:'#3b82f6', viewer:'#64748b',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <aside style={{ width:'var(--sidebar)', position:'fixed', top:0, left:0, height:'100vh', background:'#0f172a', display:'flex', flexDirection:'column', zIndex:100, borderRight:'1px solid #1e293b' }}>

      {/* Logo */}
      <div style={{ padding:'18px 18px 14px', borderBottom:'1px solid #1e293b' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:'#fff', letterSpacing:'-0.5px' }}>InvenIQ</div>
            <div style={{ fontSize:10.5, color:'#64748b' }}>Inventory Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'10px', overflowY:'auto' }}>
        {NAV.map((item, i) => {
          if (item.divider) return (
            <div key={i} style={{ padding:'14px 8px 6px', fontSize:10.5, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:1 }}>
              {item.divider}
            </div>
          );
          return (
            <NavLink key={item.to} to={item.to} end={item.exact}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10, padding:'9px 11px',
                borderRadius:9, marginBottom:2, textDecoration:'none', transition:'all .15s',
                background: isActive ? '#1e293b' : 'transparent',
                color: isActive ? '#e2e8f0' : '#64748b',
              })}>
              <item.icon size={17} />
              <span style={{ fontSize:13.5, fontWeight:500 }}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding:'10px', borderTop:'1px solid #1e293b' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 11px', borderRadius:9, background:'#1e293b' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background: ROLE_COL[user?.role]||'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13, flexShrink:0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize:10.5, color:'#475569', textTransform:'capitalize' }}>{user?.role?.replace('_',' ')}</div>
          </div>
          <button onClick={() => { logout(); nav('/login'); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', padding:4 }} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
