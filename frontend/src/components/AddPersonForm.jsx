import React, { useState } from 'react'

export default function AddPersonForm(){
  const [form, setForm] = useState({ name:'', age:'', master:'', weight:'', districtName:'', belt:'' })
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const res = await fetch(`${API}/api/person`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ 
          name: form.name,
          age: form.age ? Number(form.age) : undefined,
          master: form.master,
          weight: form.weight ? Number(form.weight) : undefined,
          districtName: form.districtName,
          belt: form.belt
        })
      })
      const data = await res.json()
      setMsg(data.message || 'Member added successfully! ✅')
      setMsgType('success')
      setForm({ name:'', age:'', master:'', weight:'', districtName:'', belt:'' })
      setTimeout(() => setMsg(''), 3000)
    } catch(err){
      setMsg('Error: '+err.message)
      setMsgType('error')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="📝 Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
      <input placeholder="🎂 Age" type="number" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} />
      <input placeholder="👨‍🏫 Master Name" value={form.master} onChange={e=>setForm({...form,master:e.target.value})} />
      <input placeholder="⚖️ Weight (kg)" type="number" step="0.1" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} />
      <input placeholder="📍 District Name" value={form.districtName} onChange={e=>setForm({...form,districtName:e.target.value})} />
      <input placeholder="🏅 Belt" value={form.belt} onChange={e=>setForm({...form,belt:e.target.value})} />
      <button type="submit">Add Member</button>
      {msg && <div className={`message ${msgType}`}>{msg}</div>}
    </form>
  )
}
