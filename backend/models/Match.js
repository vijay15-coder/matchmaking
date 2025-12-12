const mongoose = require('mongoose')

const matchSchema = new mongoose.Schema(
  {
    matchNumber: {
      type: Number,
      required: true
    },
    player1: {
      id: mongoose.Schema.Types.ObjectId,
      name: {
        type: String,
        required: true
      },
      master: String,
      age: Number,
      belt: String,
      weight: String,
      district: String
    },
    player2: {
      id: mongoose.Schema.Types.ObjectId,
      name: {
        type: String,
        required: true
      },
      master: String,
      age: Number,
      belt: String,
      weight: String,
      district: String
    },
    player1Marks: {
      type: Number,
      default: null
    },
    player2Marks: {
      type: Number,
      default: null
    },
    winner: {
      type: String,
      default: null
    },
    matchType: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'auto'
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed'],
      default: 'scheduled'
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Match', matchSchema)
