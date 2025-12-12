const express = require('express')
const Match = require('../models/Match')

const router = express.Router()

// GET all matches
router.get('/', async (req, res) => {
  try {
    const matches = await Match.find().sort({ matchNumber: 1 })
    res.json(matches)
  } catch (err) {
    console.error('Error fetching matches:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST - Save match result
router.post('/', async (req, res) => {
  try {
    const { matchNumber, player1, player2, player1Marks, player2Marks, winner, matchType } = req.body

    if (!player1 || !player2 || matchNumber === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const match = new Match({
      matchNumber,
      player1,
      player2,
      player1Marks: player1Marks || null,
      player2Marks: player2Marks || null,
      winner: winner || null,
      matchType: matchType || 'auto',
      status: (player1Marks !== undefined && player2Marks !== undefined) ? 'completed' : 'scheduled'
    })

    await match.save()
    console.log('Match saved:', match._id)
    res.status(201).json({ success: true, match })
  } catch (err) {
    console.error('Error saving match:', err)
    res.status(500).json({ error: err.message })
  }
})

// PUT - Update match with results
router.put('/:id', async (req, res) => {
  try {
    const { player1Marks, player2Marks, winner } = req.body

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      {
        player1Marks,
        player2Marks,
        winner,
        status: 'completed'
      },
      { new: true }
    )

    if (!match) {
      return res.status(404).json({ error: 'Match not found' })
    }

    console.log('Match updated:', req.params.id)
    res.json({ success: true, match })
  } catch (err) {
    console.error('Error updating match:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE - Delete single match
router.delete('/:id', async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id)

    if (!match) {
      return res.status(404).json({ error: 'Match not found' })
    }

    console.log('Match deleted:', req.params.id)
    res.json({ success: true, message: 'Match deleted successfully' })
  } catch (err) {
    console.error('Error deleting match:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE - Delete all matches
router.delete('/', async (req, res) => {
  try {
    const result = await Match.deleteMany({})
    console.log(`Deleted ${result.deletedCount} matches`)
    res.json({ success: true, deletedCount: result.deletedCount })
  } catch (err) {
    console.error('Error deleting matches:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
