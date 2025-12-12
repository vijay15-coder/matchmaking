import React, { useState } from 'react'

export default function FilterBar({ setFilters }){
  const [local, setLocal] = useState({ name:'', age:'', weight:'', master:'', belt:'', districtName:'' })

  const apply = () => {
    // Build object only with non-empty values
    const f = {}
    Object.keys(local).forEach(k => { if (local[k]) f[k]=local[k] })
    setFilters(f)
  }

  const clear = () => {
    setLocal({ name:'', age:'', weight:'', master:'', belt:'', districtName:'' })
    setFilters({})
  }

  return (
    <div>
      <input placeholder="🔎 Search by Name" value={local.name} onChange={e=>setLocal({...local,name:e.target.value})} />
      <input placeholder="🎂 Filter by Age" type="number" value={local.age} onChange={e=>setLocal({...local,age:e.target.value})} />
      <input placeholder="⚖️ Filter by Weight" type="number" step="0.1" value={local.weight} onChange={e=>setLocal({...local,weight:e.target.value})} />
      <input placeholder="👨‍🏫 Search by Master" value={local.master} onChange={e=>setLocal({...local,master:e.target.value})} />
      <input placeholder="🏅 Search by Belt" value={local.belt} onChange={e=>setLocal({...local,belt:e.target.value})} />
      <input placeholder="📍 Search by District" value={local.districtName} onChange={e=>setLocal({...local,districtName:e.target.value})} />
      <div className="button-group">
        <button onClick={apply}>🔍 Apply Filters</button>
        <button onClick={clear} style={{background:'#6c757d'}}>❌ Clear</button>
      </div>
    </div>
  )
}
