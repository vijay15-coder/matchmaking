import React, { useState, useEffect } from 'react';

export default function ManualMatchMaker({ onMatchAdded }) {
  const [people, setPeople] = useState([]);
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [winner, setWinner] = useState(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/person');
        const json = await res.json();
        setPeople(json);
      } catch (err) {
        console.error('Failed to fetch people:', err);
        setMsg('⚠️ Failed to load people from database');
        setMsgType('error');
      }
    };
    fetchPeople();
  }, []);

  const handleDeclareWinner = () => {
    if (!player1 || !player2) {
      setMsg('Please select both players');
      setMsgType('error');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    if (player1 === player2) {
      setMsg('Players must be different');
      setMsgType('error');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    const p1 = people.find((p) => p._id === player1);
    const p2 = people.find((p) => p._id === player2);

    if (!p1 || !p2) {
      setMsg('One or both players not found');
      setMsgType('error');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    let determinedWinner = null;
    if (player1Score > player2Score) {
      determinedWinner = p1;
    } else if (player2Score > player1Score) {
      determinedWinner = p2;
    }

    setWinner(determinedWinner);

    let hasSameMaster = false;
    if (p1.master && p2.master && p1.master === p2.master) {
      setMsg(`⚠️ Both players are from ${p1.master}'s group`);
      setMsgType('warning');
      hasSameMaster = true;
    } else {
      setMsg('✅ Match results recorded!');
      setMsgType('success');
    }

    onMatchAdded({
      player1: {
        id: p1._id,
        name: p1.name,
        age: p1.age,
        master: p1.master,
        belt: p1.belt,
        weight: p1.weight,
        district: p1.districtName,
        score: player1Score,
      },
      player2: {
        id: p2._id,
        name: p2.name,
        age: p2.age,
        master: p2.master,
        belt: p2.belt,
        weight: p2.weight,
        district: p2.districtName,
        score: player2Score,
      },
      winner: determinedWinner,
    });

    setPlayer1('');
    setPlayer2('');
    setPlayer1Score(0);
    setPlayer2Score(0);
    setWinner(null);
    setTimeout(() => setMsg(''), hasSameMaster ? 5000 : 4000);
  };

  return (
    <div className="manual-match-card">
      <h4>➕ Declare Winner</h4>

      <div className="player-selection">
        <div className="player-group">
          <label className="player-label">🥋 Player 1</label>
          <select
            value={player1}
            onChange={(e) => setPlayer1(e.target.value)}
            disabled={people.length === 0}
          >
            <option value="">-- Select Player 1 --</option>
            {people.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.master || 'N/A'})
              </option>
            ))}
          </select>
          <div className="score-input-wrapper">
            <label className="score-label">Enter Score:</label>
            <input
              type="number"
              value={player1Score}
              onChange={(e) => setPlayer1Score(parseInt(e.target.value, 10) || 0)}
              min="0"
              max="999"
              placeholder="0"
              className="score-input"
            />
          </div>
        </div>

        <div className="vs-section">
          <span className="vs-text">VS</span>
        </div>

        <div className="player-group">
          <label className="player-label">🥋 Player 2</label>
          <select
            value={player2}
            onChange={(e) => setPlayer2(e.target.value)}
            disabled={people.length === 0}
          >
            <option value="">-- Select Player 2 --</option>
            {people.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.master || 'N/A'})
              </option>
            ))}
          </select>
          <div className="score-input-wrapper">
            <label className="score-label">Enter Score:</label>
            <input
              type="number"
              value={player2Score}
              onChange={(e) => setPlayer2Score(parseInt(e.target.value, 10) || 0)}
              min="0"
              max="999"
              placeholder="0"
              className="score-input"
            />
          </div>
        </div>
      </div>

      <div className="manual-match-actions">
        <button
          className="create-btn"
          onClick={handleDeclareWinner}
          disabled={!player1 || !player2 || people.length === 0}
        >
          Declare Winner
        </button>
      </div>

      {msg && (
        <div
          className={`manual-match-${
            msgType === 'success' ? 'success' : msgType === 'error' ? 'warning' : 'warning'
          }`}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
