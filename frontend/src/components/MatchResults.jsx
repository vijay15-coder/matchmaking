import React, { useState } from 'react'

export default function MatchResults({ match, matchIdx, onResultSaved, matchId }){
  const [player1Marks, setPlayer1Marks] = useState('')
  const [player2Marks, setPlayer2Marks] = useState('')
  const [winner, setWinner] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (player1Marks === '' || player2Marks === '') {
      setError('Please enter marks for both players')
      return
    }

    setLoading(true)
    const winnerName = winner || (Number(player1Marks) > Number(player2Marks) ? match.player1.name : match.player2.name)

    const resultData = {
      matchNumber: matchIdx + 1,
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
      player1Marks: Number(player1Marks),
      player2Marks: Number(player2Marks),
      winner: winnerName,
      matchType: 'auto'
    }

    try {
      const url = matchId ? `http://localhost:5000/api/match/${matchId}` : 'http://localhost:5000/api/match'
      const method = matchId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save result')
      }

      console.log('Match result saved to DB:', data.match)
      setError('')
      setSaved(true)

      // Notify parent component
      if (onResultSaved) {
        onResultSaved(data.match)
      }

      // Reset form after 3 seconds
      setTimeout(() => {
        setSaved(false)
        setPlayer1Marks('')
        setPlayer2Marks('')
        setWinner('')
      }, 3000)
    } catch (err) {
      console.error('Error saving result:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="result-card">
      <div className="result-header">Match {matchIdx + 1} - Enter Results</div>
      <div className="result-body">
        <div className="result-player">
          <div className="result-player-name">{match.player1.name}</div>
          <div className="result-player-master">{match.player1.master}</div>
          <div className="result-input-group">
            <label>Marks (0-100)</label>
            <input 
              type="number" 
              placeholder="Enter marks" 
              value={player1Marks}
              onChange={e => setPlayer1Marks(e.target.value)}
              min="0"
              max="100"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="result-player">
          <div className="result-player-name">{match.player2.name}</div>
          <div className="result-player-master">{match.player2.master}</div>
          <div className="result-input-group">
            <label>Marks (0-100)</label>
            <input 
              type="number" 
              placeholder="Enter marks" 
              value={player2Marks}
              onChange={e => setPlayer2Marks(e.target.value)}
              min="0"
              max="100"
              disabled={loading}
              required
            />
          </div>
        </div>
      </div>

      <div className="result-footer">
        <div style={{display: 'flex', gap: 10, width: '100%', alignItems: 'center'}}>
          <div style={{flex: 1, minWidth: '150px'}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem', color: '#555'}}>
              Winner Selection
            </label>
            <select value={winner} onChange={e => setWinner(e.target.value)} disabled={loading} style={{width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.9rem'}}>
              <option value="">Auto (Higher marks)</option>
              <option value={match.player1.name}>🏆 {match.player1.name}</option>
              <option value={match.player2.name}>🏆 {match.player2.name}</option>
            </select>
          </div>
          <button onClick={handleSave} disabled={loading} style={{flex: 1, padding: '10px 16px', background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.95rem'}}>
            {loading ? '⏳ Saving...' : '💾 Save Result'}
          </button>
        </div>
      </div>

      {error && <div className="result-message error">{error}</div>}
      {saved && <div className="result-message success">✅ Result Saved to Database!</div>}
    </div>
  )
}
