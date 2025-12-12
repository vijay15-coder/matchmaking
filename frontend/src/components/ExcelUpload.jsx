import React, { useState } from 'react'

export default function ExcelUpload(){
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')

  const upload = async () => {
    if (!file) return setMsg('Select a file')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('http://localhost:5000/api/person/upload', {
        method:'POST',
        body: fd
      })
      const data = await res.json()
      if (data.error) setMsg('Error: ' + data.error)
      else setMsg(data.message + ' (' + (data.inserted || 0) + ' inserted)')
    } catch(err) {
      setMsg('Error: ' + err.message)
    }
  }

  return (
    <div>
      <input type="file" accept=".xlsx,.xls" onChange={e=>setFile(e.target.files[0])} />
      <button onClick={upload}>Upload Excel</button>
      {msg && <div style={{marginTop:8}}>{msg}</div>}
      <div style={{marginTop:8, fontSize:13}}>
        Excel should have headers: <strong>name, age, city, email</strong> (case-insensitive)
      </div>
    </div>
  )
}
