import React, { useEffect, useState } from 'react'
import ManualMatchMaker from './ManualMatchMaker'
import MatchResults from './MatchResults'
import * as XLSX from 'xlsx'

export default function MatchMaker(){
  const [allMatches, setAllMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const MATCHES_PER_PAGE = 10

  // State for inline mark entry
  const [matchMarks, setMatchMarks] = useState({})

  // State for showing MatchResults modal
  const [showResultsModal, setShowResultsModal] = useState(null)

  // Filter states
  const [filters, setFilters] = useState({
    status: '', // 'all', 'scheduled', 'completed'
    player1Name: '',
    player2Name: '',
    master: '',
    matchType: '', // 'all', 'auto', 'manual'
    minAge: '',
    maxAge: '',
    minWeight: '',
    maxWeight: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Load all matches from database on component mount
  useEffect(() => {
    loadAllMatches()
  }, [])

  const loadAllMatches = async () => {
    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const res = await fetch(`${API}/api/match`)
      const data = await res.json()
      const sorted = (data || []).sort((a, b) => a.matchNumber - b.matchNumber)
      setAllMatches(sorted)
      console.log('Loaded matches from DB:', sorted.length)
    } catch (err) {
      console.error('Error fetching matches:', err)
    }
  }

  // Apply filters to matches
  const getFilteredMatches = () => {
    return allMatches.filter(match => {
      if (filters.status && filters.status !== 'all' && match.status !== filters.status) return false
      if (filters.matchType && filters.matchType !== 'all' && match.matchType !== filters.matchType) return false
      if (filters.player1Name && !match.player1.name.toLowerCase().includes(filters.player1Name.toLowerCase())) return false
      if (filters.player2Name && !match.player2.name.toLowerCase().includes(filters.player2Name.toLowerCase())) return false
      if (filters.master && !match.player1.master?.toLowerCase().includes(filters.master.toLowerCase()) && !match.player2.master?.toLowerCase().includes(filters.master.toLowerCase())) return false
      
      // Age range filter (check both players)
      if (filters.minAge !== '' || filters.maxAge !== '') {
        const minAge = filters.minAge !== '' ? Number(filters.minAge) : 0
        const maxAge = filters.maxAge !== '' ? Number(filters.maxAge) : 999
        const p1Age = match.player1.age || 0
        const p2Age = match.player2.age || 0
        const p1InRange = p1Age >= minAge && p1Age <= maxAge
        const p2InRange = p2Age >= minAge && p2Age <= maxAge
        if (!p1InRange && !p2InRange) return false // Both must be in range
      }
      
      // Weight range filter (check both players)
      if (filters.minWeight !== '' || filters.maxWeight !== '') {
        const minWeight = filters.minWeight !== '' ? Number(filters.minWeight) : 0
        const maxWeight = filters.maxWeight !== '' ? Number(filters.maxWeight) : 999
        const p1Weight = match.player1.weight || 0
        const p2Weight = match.player2.weight || 0
        const p1InRange = p1Weight >= minWeight && p1Weight <= maxWeight
        const p2InRange = p2Weight >= minWeight && p2Weight <= maxWeight
        if (!p1InRange && !p2InRange) return false // Both must be in range
      }
      
      return true
    })
  }

  // Download filtered matches as Excel (4 matches per file = 4 teams/pairings)
  const downloadExcel = () => {
    const filteredMatches = getFilteredMatches()
    
    if (filteredMatches.length === 0) {
      setMsg('⚠️ No matches to download with current filters')
      setMsgType('error')
      setTimeout(() => setMsg(''), 3000)
      return
    }

    const MATCHES_PER_FILE = 4
    const totalFiles = Math.ceil(filteredMatches.length / MATCHES_PER_FILE)

    // Download each chunk as separate file
    for (let fileNum = 0; fileNum < totalFiles; fileNum++) {
      const startIdx = fileNum * MATCHES_PER_FILE
      const endIdx = Math.min(startIdx + MATCHES_PER_FILE, filteredMatches.length)
      const chunkMatches = filteredMatches.slice(startIdx, endIdx)

      const data = []
      chunkMatches.forEach((match, idx) => {
        // Player 1 row
        data.push({
          'Match #': match.matchNumber,
          'Player Name': match.player1.name,
          'Master': match.player1.master || '—',
          'Belt': match.player1.belt || '—',
          'Age': match.player1.age || '—',
          'Weight': match.player1.weight || '—',
          'Marks': match.player1Marks !== null && match.player1Marks !== undefined ? match.player1Marks : '—',
          'Winner': match.winner === match.player1.name ? '✓' : '—',
          'Match Type': match.matchType || 'auto',
          'Status': match.status,
          'Match Date': new Date(match.createdAt || Date.now()).toLocaleDateString()
        })
        
        // Player 2 row
        data.push({
          'Match #': '',
          'Player Name': match.player2.name,
          'Master': match.player2.master || '—',
          'Belt': match.player2.belt || '—',
          'Age': match.player2.age || '—',
          'Weight': match.player2.weight || '—',
          'Marks': match.player2Marks !== null && match.player2Marks !== undefined ? match.player2Marks : '—',
          'Winner': match.winner === match.player2.name ? '✓' : '—',
          'Match Type': '',
          'Status': '',
          'Match Date': ''
        })
        
        // Blank row separator between matches
        if (idx < chunkMatches.length - 1) {
          data.push({})
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Teams')

      // Set column widths
      const colWidths = [
        { wch: 8 },   // Match #
        { wch: 20 },  // Player Name
        { wch: 15 },  // Master
        { wch: 12 },  // Belt
        { wch: 8 },   // Age
        { wch: 10 },  // Weight
        { wch: 8 },   // Marks
        { wch: 8 },   // Winner (✓ or —)
        { wch: 12 },  // Match Type
        { wch: 10 },  // Status
        { wch: 12 }   // Match Date
      ]
      worksheet['!cols'] = colWidths

      const dateStr = new Date().toISOString().split('T')[0]
      const filename = totalFiles > 1 
        ? `teams_${dateStr}_part${fileNum + 1}of${totalFiles}.xlsx`
        : `teams_${dateStr}.xlsx`
      
      XLSX.writeFile(workbook, filename)
    }

    const message = totalFiles > 1 
      ? `✅ Downloaded ${filteredMatches.length} matches in ${totalFiles} files (4 teams per file)!`
      : `✅ Downloaded ${filteredMatches.length} matches as Excel (4 teams)!`
    
    setMsg(message)
    setMsgType('success')
    setTimeout(() => setMsg(''), 3000)
  }

  const generateMatches = async () => {
    setLoading(true)
    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const res = await fetch(`${API}/api/person/generate`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setMsg(json.error || 'Error generating matches')
        setMsgType('error')
      } else {
        const generatedMatches = json.matches || []
        const matchInfo = `Generated ${generatedMatches.length} matches`
        const info = json.unmatched > 0 ? ` (${json.unmatched} could not be matched)` : ' - All balanced!'
        
        let savedCount = 0
        for (let i = 0; i < generatedMatches.length; i++) {
          const match = generatedMatches[i]
          const matchData = {
            matchNumber: allMatches.length + i + 1,
            player1: match.player1,
            player2: match.player2,
            player1Marks: null,
            player2Marks: null,
            winner: null,
            matchType: 'auto',
            status: 'scheduled'
          }
          
          try {
            const saveRes = await fetch(`${API}/api/match`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(matchData)
            })
            if (saveRes.ok) {
              savedCount++
            }
          } catch (err) {
            console.error('Error saving match:', err)
          }
        }
        
        await loadAllMatches()
        setMsg(`✅ ${matchInfo}${info} - ${savedCount} saved to database`)
        setMsgType('success')
        setShowManual(false)
      }
      setTimeout(() => setMsg(''), 4000)
    } catch(err){
      console.error(err)
      setMsg(`Network error: ${err.message}`)
      setMsgType('error')
      setTimeout(() => setMsg(''), 4000)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomMatch = async (newMatch) => {
    const matchData = {
      matchNumber: allMatches.length + 1,
      player1: newMatch.player1,
      player2: newMatch.player2,
      player1Marks: newMatch.player1.score,
      player2Marks: newMatch.player2.score,
      winner: newMatch.winner ? newMatch.winner.name : null,
      matchType: 'manual',
      status: 'completed'
    }

    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const res = await fetch(`${API}/api/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData)
      })
      if (!res.ok) throw new Error('Failed to save match')
      
      await loadAllMatches()
      setMsg('✅ Custom match added and saved!')
      setMsgType('success')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      console.error('Error adding custom match:', err)
      setMsg('❌ Failed to save match')
      setMsgType('error')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const handleDeleteMatch = async (matchId) => {
    if (!confirm('Delete this match?')) return

    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const res = await fetch(`${API}/api/match/${matchId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete match')
      }

      await loadAllMatches()
      setMsg('✅ Match deleted successfully!')
      setMsgType('success')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      console.error('Error deleting match:', err)
      setMsg(err.message)
      setMsgType('error')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const handleDeclareWinner = async (match, matchIdx) => {
    const marks = matchMarks[match._id] || { player1: '', player2: '', winner: '' }
    
    if (marks.player1 === '' || marks.player2 === '') {
      setMsg('⚠️ Please enter marks for both players')
      setMsgType('error')
      setTimeout(() => setMsg(''), 3000)
      return
    }

    const p1Marks = Number(marks.player1)
    const p2Marks = Number(marks.player2)
    
    if (isNaN(p1Marks) || isNaN(p2Marks)) {
      setMsg('⚠️ Please enter valid numbers for marks')
      setMsgType('error')
      setTimeout(() => setMsg(''), 3000)
      return
    }

    let winnerName = marks.winner || (p1Marks > p2Marks ? match.player1.name : p2Marks > p1Marks ? match.player2.name : null)

    const resultData = {
      matchNumber: match.matchNumber,
      player1: {
        id: match.player1.id,
        name: match.player1.name,
        master: match.player1.master,
        age: match.player1.age,
        belt: match.player1.belt,
        weight: match.player1.weight,
        district: match.player1.district
      },
      player2: {
        id: match.player2.id,
        name: match.player2.name,
        master: match.player2.master,
        age: match.player2.age,
        belt: match.player2.belt,
        weight: match.player2.weight,
        district: match.player2.district
      },
      player1Marks: p1Marks,
      player2Marks: p2Marks,
      winner: winnerName,
      matchType: match.matchType || 'auto',
      status: 'completed'
    }

    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const res = await fetch(`${API}/api/match/${match._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save result')
      }

      await loadAllMatches()
      setMatchMarks(prev => {
        const updated = { ...prev }
        delete updated[match._id]
        return updated
      })
      setMsg('✅ Winner declared and saved!')
      setMsgType('success')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      console.error('Error saving result:', err)
      setMsg(`❌ Error: ${err.message}`)
      setMsgType('error')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const handleMarkChange = (matchId, player, value) => {
    setMatchMarks(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [player]: value
      }
    }))
  }

  const handleWinnerChange = (matchId, value) => {
    setMatchMarks(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        winner: value
      }
    }))
  }

  const filteredMatches = getFilteredMatches()
  const totalPages = Math.ceil(filteredMatches.length / MATCHES_PER_PAGE)
  const startIndex = (currentPage - 1) * MATCHES_PER_PAGE
  const endIndex = startIndex + MATCHES_PER_PAGE
  const paginatedMatches = filteredMatches.slice(startIndex, endIndex)

  const clearAllMatches = async () => {
    if (!confirm('Delete ALL matches from database? This cannot be undone!')) return

    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const res = await fetch(`${API}/api/match`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete matches')
      }

      setAllMatches([])
      setCurrentPage(1)
      setMsg(`✅ Deleted ${data.deletedCount} matches!`)
      setMsgType('success')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      console.error('Error clearing matches:', err)
      setMsg(err.message)
      setMsgType('error')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  return (
    <div>
      <div style={{display: 'flex', gap: 10, marginBottom: 15, flexWrap: 'wrap'}}>
        <button disabled={loading} onClick={generateMatches} style={{background: loading ? '#999' : '#28a745', flex: 1, minWidth: '200px'}}>
          {loading ? '⏳ Generating...' : '⚔️ Generate Balanced Matches'}
        </button>
        <button onClick={() => setShowManual(!showManual)} style={{background: '#007bff', flex: 1, minWidth: '200px'}}>
          {showManual ? '✕ Close Manual' : '✏️ Manual Match'}
        </button>
        <button onClick={() => setShowFilters(!showFilters)} style={{background: '#17a2b8', flex: 1, minWidth: '200px'}}>
          {showFilters ? '✕ Hide Filters' : '🔍 Filters'}
        </button>
        <button onClick={downloadExcel} style={{background: '#28a745', flex: 1, minWidth: '200px'}}>📥 Download Excel</button>
        <button onClick={clearAllMatches} style={{background: '#dc3545', flex: 1, minWidth: '200px'}}>🗑️ Clear All</button>
      </div>

      {msg && <div className={`message ${msgType}`}>{msg}</div>}

      {showFilters && (
        <div style={{background: '#f0f7ff', padding: 15, borderRadius: 8, marginBottom: 15, border: '2px solid #17a2b8'}}>
          <h3 style={{marginBottom: 12, color: '#17a2b8'}}>🔍 Filter Matches</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12}}>
            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem'}}>Status</label>
              <select value={filters.status} onChange={(e) => {setFilters({...filters, status: e.target.value}); setCurrentPage(1)}} style={{width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd'}}>
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem'}}>Match Type</label>
              <select value={filters.matchType} onChange={(e) => {setFilters({...filters, matchType: e.target.value}); setCurrentPage(1)}} style={{width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd'}}>
                <option value="">All Types</option>
                <option value="auto">Auto Generated</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem'}}>Player 1 Name</label>
              <input type="text" placeholder="Search..." value={filters.player1Name} onChange={(e) => {setFilters({...filters, player1Name: e.target.value}); setCurrentPage(1)}} style={{width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd'}} />
            </div>
            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem'}}>Player 2 Name</label>
              <input type="text" placeholder="Search..." value={filters.player2Name} onChange={(e) => {setFilters({...filters, player2Name: e.target.value}); setCurrentPage(1)}} style={{width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd'}} />
            </div>
            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem'}}>Master Name</label>
              <input type="text" placeholder="Search..." value={filters.master} onChange={(e) => {setFilters({...filters, master: e.target.value}); setCurrentPage(1)}} style={{width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd'}} />
            </div>
            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem'}}>Min Age</label>
              <input type="number" placeholder="Min" value={filters.minAge} onChange={(e) => {setFilters({...filters, minAge: e.target.value}); setCurrentPage(1)}} style={{width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd'}} />
            </div>
            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem'}}>Max Age</label>
              <input type="number" placeholder="Max" value={filters.maxAge} onChange={(e) => {setFilters({...filters, maxAge: e.target.value}); setCurrentPage(1)}} style={{width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd'}} />
            </div>
            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem'}}>Min Weight</label>
              <input type="number" placeholder="Min" value={filters.minWeight} onChange={(e) => {setFilters({...filters, minWeight: e.target.value}); setCurrentPage(1)}} style={{width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd'}} />
            </div>
            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem'}}>Max Weight</label>
              <input type="number" placeholder="Max" value={filters.maxWeight} onChange={(e) => {setFilters({...filters, maxWeight: e.target.value}); setCurrentPage(1)}} style={{width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd'}} />
            </div>
            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem'}}>Showing {filteredMatches.length} matches</label>
              <button onClick={() => {setFilters({status: '', player1Name: '', player2Name: '', master: '', matchType: '', minAge: '', maxAge: '', minWeight: '', maxWeight: ''}); setCurrentPage(1)}} style={{width: '100%', padding: '8px 10px', borderRadius: 6, background: '#6c757d', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600}}>Clear Filters</button>
            </div>
          </div>
        </div>
      )}

      {showManual && (
        <div style={{background: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 15, border: '2px solid #007bff'}}>
          <h3 style={{marginBottom: 15, color: '#007bff'}}>Declare Winner</h3>
          <ManualMatchMaker onMatchAdded={handleAddCustomMatch} />
        </div>
      )}

      {allMatches.length === 0 && (
        <div className="empty-state">
          📋 No matches yet. Click "Generate Balanced Matches" or create one manually.
        </div>
      )}

      {filteredMatches.length === 0 && allMatches.length > 0 && (
        <div className="empty-state">
          🔍 No matches match your filters. Try adjusting them.
        </div>
      )}

      {filteredMatches.length > 0 && (
        <div style={{marginTop: 20}}>
          <h3 style={{color: '#667eea', marginBottom: 15}}>
            ⚔️ All Matches ({filteredMatches.length})
            {filteredMatches.some(m => m.status === 'completed') && (
              <span style={{marginLeft: 10, fontSize: '0.9rem', color: '#28a745'}}>
                - {filteredMatches.filter(m => m.status === 'completed').length} completed
              </span>
            )}
          </h3>

          <div>
            {paginatedMatches.map((match, idx) => (
              <div key={match._id} style={{marginBottom: 15}}>
                <div className="match-card">
                  <div className="match-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span>Match {match.matchNumber}</span>
                    <button 
                      onClick={() => handleDeleteMatch(match._id)}
                      style={{background: 'rgba(255,255,255,0.3)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem'}}
                    >
                      ✕ Delete
                    </button>
                  </div>
                  <div className="match-body">
                    <div className="contestant">
                      <div className="contestant-name">{match.player1.name}</div>
                      <div className="contestant-details">
                        <span><strong>Age:</strong> {match.player1.age || '—'}</span>
                        <span><strong>Belt:</strong> {match.player1.belt || '—'}</span>
                        <span><strong>Master:</strong> {match.player1.master || '—'}</span>
                        <span><strong>Weight:</strong> {match.player1.weight || '—'}</span>
                      </div>
                    </div>

                    <div className="vs-divider">VS</div>

                    <div className="contestant">
                      <div className="contestant-name">{match.player2.name}</div>
                      <div className="contestant-details">
                        <span><strong>Age:</strong> {match.player2.age || '—'}</span>
                        <span><strong>Belt:</strong> {match.player2.belt || '—'}</span>
                        <span><strong>Master:</strong> {match.player2.master || '—'}</span>
                        <span><strong>Weight:</strong> {match.player2.weight || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {match.status === 'completed' && (
                    <div className="match-score-display">
                      <div>
                        <strong>📍 {match.player1.name}:</strong>
                        <span className="score-value">{match.player1Marks !== null && match.player1Marks !== undefined ? match.player1Marks : '—'} points</span>
                      </div>
                      <div>
                        <strong>📍 {match.player2.name}:</strong>
                        <span className="score-value">{match.player2Marks !== null && match.player2Marks !== undefined ? match.player2Marks : '—'} points</span>
                      </div>
                      <div className="winner-badge">
                        🏆 Winner: {match.winner || '—'}
                      </div>
                    </div>
                  )}

                  {match.status !== 'completed' && (
                    <div className="match-mark-entry">
                      <div className="mark-input-row">
                        <div className="mark-input-group">
                          <label>📝 {match.player1.name}'s Marks</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Enter marks"
                            value={matchMarks[match._id]?.player1 || ''}
                            onChange={(e) => handleMarkChange(match._id, 'player1', e.target.value)}
                          />
                        </div>

                        <div className="mark-input-group">
                          <label>📝 {match.player2.name}'s Marks</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Enter marks"
                            value={matchMarks[match._id]?.player2 || ''}
                            onChange={(e) => handleMarkChange(match._id, 'player2', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mark-winner-selection">
                        <label>🏆 Select Winner (or auto-select by higher marks)</label>
                        <select
                          value={matchMarks[match._id]?.winner || ''}
                          onChange={(e) => handleWinnerChange(match._id, e.target.value)}
                        >
                          <option value="">Auto (Higher Marks)</option>
                          <option value={match.player1.name}>{match.player1.name}</option>
                          <option value={match.player2.name}>{match.player2.name}</option>
                        </select>
                      </div>

                      <button 
                        className="declare-winner-btn"
                        onClick={() => handleDeclareWinner(match, idx)}
                      >
                        ✅ Declare Winner
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{marginTop: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{padding: '8px 12px', background: currentPage === 1 ? '#ccc' : '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: currentPage === 1 ? 'not-allowed' : 'pointer'}}
              >
                ← Previous
              </button>

              {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '8px 12px',
                    background: currentPage === page ? '#667eea' : '#e0e0e0',
                    color: currentPage === page ? 'white' : '#333',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: currentPage === page ? '600' : 'normal',
                    minWidth: '40px'
                  }}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{padding: '8px 12px', background: currentPage === totalPages ? '#ccc' : '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'}}
              >
                Next →
              </button>

              <span style={{marginLeft: 15, color: '#666', fontSize: '0.9rem'}}>
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
