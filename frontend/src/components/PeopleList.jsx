import React, { useEffect, useState } from 'react'

export default function PeopleList({ filters }){
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('')
  const [clearing, setClearing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams(filters).toString()
    const url = 'http://localhost:5000/api/person' + (params ? '?' + params : '')
    try {
      const res = await fetch(url)
      const json = await res.json()
      setData(json)
    } catch(err){
      console.error(err)
      setMsg('Error loading members')
      setMsgType('error')
    } finally { setLoading(false) }
  }

  useEffect(()=>{ 
    fetchData()
    setCurrentPage(1)
  }, [filters])

  const remove = async (id) => {
    if (!confirm('Are you sure you want to delete this member?')) return
    try {
      await fetch('http://localhost:5000/api/person/'+id, { method:'DELETE' })
      setData(data.filter(d => d._id !== id))
      setMsg('Member removed')
      setMsgType('success')
      setTimeout(()=>setMsg(''), 2500)
    } catch(err){
      console.error(err)
      setMsg('Error removing member')
      setMsgType('error')
      setTimeout(()=>setMsg(''), 3000)
    }
  }

  const clearAll = async () => {
    if (!confirm('This will permanently delete ALL members. Continue?')) return
    setClearing(true)
    try {
      const res = await fetch('http://localhost:5000/api/person', { method: 'DELETE' })
      let json = {}
      try { json = await res.json() } catch(e) { /* ignore json parse error */ }
      if (!res.ok) {
        const errMsg = json.error || res.statusText || `Status ${res.status}`
        setMsg(`Error clearing members: ${errMsg}`)
        setMsgType('error')
      } else {
        setMsg(json.message || 'All members removed')
        setMsgType('success')
        setData([])
      }
      setTimeout(()=>setMsg(''), 4000)
    } catch(err){
      console.error(err)
      setMsg('Network error clearing members')
      setMsgType('error')
      setTimeout(()=>setMsg(''), 4000)
    } finally {
      setClearing(false)
    }
  }

  if (loading) return <div className="loading">⏳ Loading members...</div>

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:10}}>
        <div style={{fontWeight:600}}>Showing {currentData.length} of {data.length} member{data.length!==1 ? 's' : ''}</div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <button disabled={clearing} onClick={clearAll} style={{background:'#dc3545', width:'auto', padding:'8px 12px'}}>{clearing ? 'Clearing...' : '🧹 Clear All'}</button>
        </div>
      </div>

      {msg && <div className={`message ${msgType}`}>{msg}</div>}

      {data.length === 0 && <div className="empty-state">😔 No members found. Try adjusting your filters.</div>}
      
      {currentData.length > 0 && (
        <>
          {currentData.map(p => (
            <div key={p._id} className="person">
              <div className="person-info">
                <div className="person-name">👤 {p.name}</div>
                <div className="person-details">
                  {(() => {
                    const fields = [
                      ['name', 'Name'],
                      ['age', 'Age'],
                      ['master', 'Master'],
                      ['weight', 'Weight'],
                      ['districtName', 'District'],
                      ['belt', 'Belt']
                    ]

                    return fields.map(([key, label]) => {
                      let value = p[key]
                      const isEmpty = value === undefined || value === null || value === ''
                      if (!isEmpty) {
                        if (key === 'age') value = `${value} years`
                      }
                      return (
                        <div key={key} className="person-detail-item">
                          <span className="person-detail-label">{label}:</span> {isEmpty ? '—' : String(value)}
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
              <div className="person-actions">
                <button onClick={()=>remove(p._id)}>🗑️ Delete</button>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                className="pagination-btn pagination-prev"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                ⬅️ Previous
              </button>

              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="pagination-btn pagination-next"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next ➡️
              </button>
            </div>
          )}

          <div className="pagination-info">
            📄 Page {currentPage} of {totalPages} • 👀 Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} members
          </div>
        </>
      )}
    </div>
  )
}
