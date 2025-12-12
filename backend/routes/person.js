const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');

// multer setup
const upload = multer({ dest: 'uploads/' });

// POST add person
router.post('/', async (req, res) => {
  try {
    const p = new Person(req.body);
    const saved = await p.save();
    res.json({ message: 'Person added', person: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET persons with query filters
router.get('/', async (req, res) => {
  try {
    // Build filter: allow partial case-insensitive match for strings
    const raw = req.query || {};
    const filter = {};
    for (const key of Object.keys(raw)) {
      if (['name','master','districtName','belt'].includes(key) && raw[key]) {
        filter[key] = { $regex: raw[key], $options: 'i' };
      } else if (['age','weight'].includes(key) && raw[key]) {
        filter[key] = Number(raw[key]);
      }
    }
    const people = await Person.find(filter).sort({ createdAt: -1 });
    res.json(people);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE person
// DELETE all persons (clear collection)
router.delete('/', async (req, res) => {
  try {
    console.log('Received request to delete ALL persons from', req.ip || req.connection.remoteAddress)
    const result = await Person.deleteMany({});
    console.log('deleteMany result:', result)
    res.json({ message: 'All people removed', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Error deleting all persons:', err)
    res.status(500).json({ error: err.message });
  }
});

// DELETE person by id
router.delete('/:id', async (req, res) => {
  try {
    console.log('Received request to delete person id=', req.params.id)
    const removed = await Person.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Person not found' });
    res.json({ message: 'Person removed', person: removed });
  } catch (err) {
    console.error('Error deleting person by id:', err)
    res.status(500).json({ error: err.message });
  }
});

// Upload Excel and insert many
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    console.log('Uploading file:', req.file.originalname)
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    console.log(`Read ${data.length} rows from Excel`)
    console.log('First row headers:', Object.keys(data[0] || {}))

    // Map spreadsheet headers to schema fields (Name, Age, Weight, Belt, Master Name, District name)
    const docs = data.map(row => {
      const rawName = row.name || row.Name || row.NAME || ''
      const rawAge = row.age || row.Age || row.AGE || ''
      const rawWeight = row.Weight || row.weight || row.WEIGHT || ''
      const rawBelt = row.Belt || row.belt || row.BELT || ''
      const rawMaster = row['Master Name'] || row['Master name'] || row.master || row.Master || ''
      const rawDistrict = row['District name'] || row['District Name'] || row.district || row.District || ''

      // parse age to number if possible
      let ageVal = undefined
      const ageDigits = String(rawAge).match(/\d+/)
      if (ageDigits) ageVal = Number(ageDigits[0])

      // keep weight as string (can be "35kg", "22-35kg", etc)
      const weightVal = rawWeight ? String(rawWeight).trim() : undefined

      return {
        name: String(rawName).trim(),
        age: ageVal,
        master: rawMaster ? String(rawMaster).trim() : undefined,
        weight: weightVal,
        districtName: rawDistrict ? String(rawDistrict).trim() : undefined,
        belt: rawBelt ? String(rawBelt).trim() : undefined
      }
    }).filter(d => d.name); // require name to insert rows

    console.log(`Mapped ${docs.length} valid documents for insertion`)
    if (docs.length > 0) console.log('Sample doc:', JSON.stringify(docs[0], null, 2))

    if (docs.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'No valid rows to insert' });
    }

    await Person.insertMany(docs);
    fs.unlinkSync(req.file.path);
    console.log(`Successfully inserted ${docs.length} documents`)
    res.json({ message: 'Excel data imported', inserted: docs.length });
  } catch (err) {
    console.error('Error in Excel upload:', err)
    res.status(500).json({ error: err.message });
  }
});

// Generate 1v1 matches (STRICT: same age FIRST, then different master)
router.post('/generate', async (req, res) => {
  try {
    console.log('\n=== STRICT MATCHING: SAME AGE + DIFFERENT MASTER ===\n')
    const people = await Person.find({})
    
    if (people.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 people to create matches' })
    }

    // Step 1: Group by age
    const ageGroups = {}
    people.forEach(p => {
      const age = p.age
      if (age === undefined || age === null) {
        console.log(`⚠️ Skipping ${p.name} - no age data`)
        return
      }
      if (!ageGroups[age]) ageGroups[age] = []
      ageGroups[age].push(p)
    })

    console.log('📊 Age Groups:')
    Object.entries(ageGroups).forEach(([age, players]) => {
      console.log(`  Age ${age}: ${players.length} players`)
    })

    const matches = []
    const used = new Set()

    // Step 2: For each age, match players with different masters
    Object.keys(ageGroups).sort((a, b) => Number(a) - Number(b)).forEach(age => {
      const availablePlayers = ageGroups[age].filter(p => !used.has(String(p._id)))
      
      console.log(`\n👥 Processing Age ${age} (${availablePlayers.length} available):`)
      
      if (availablePlayers.length < 2) {
        console.log(`  ❌ Only ${availablePlayers.length} player(s) - CANNOT MATCH`)
        return
      }

      // Group by master
      const masterGroups = {}
      availablePlayers.forEach(p => {
        const master = p.master || 'unknown'
        if (!masterGroups[master]) masterGroups[master] = []
        masterGroups[master].push(p)
      })

      const masterList = Object.keys(masterGroups).sort()
      console.log(`  Masters: ${masterList.map(m => `${m}(${masterGroups[m].length})`).join(', ')}`)

      // Match: take from each master in rotation, pair with different master
      const queues = {}
      masterList.forEach(m => {
        queues[m] = [...masterGroups[m]]
      })

      let matchCount = 0
      let maxIterations = 1000
      let iter = 0

      while (iter < maxIterations) {
        iter++
        let found = false

        // Try to find a pair from different masters
        for (let i = 0; i < masterList.length; i++) {
          const m1 = masterList[i]
          if (queues[m1].length === 0) continue

          // Find someone from a different master
          for (let j = 0; j < masterList.length; j++) {
            if (i === j) continue // Must be different master
            
            const m2 = masterList[j]
            if (queues[m2].length === 0) continue

            const p1 = queues[m1].shift()
            const p2 = queues[m2].shift()

            console.log(`  ✅ Match: ${p1.name} (${m1}) vs ${p2.name} (${m2})`)

            matches.push({
              player1: {
                id: p1._id,
                name: p1.name,
                age: p1.age,
                master: p1.master,
                belt: p1.belt,
                weight: p1.weight,
                district: p1.districtName
              },
              player2: {
                id: p2._id,
                name: p2.name,
                age: p2.age,
                master: p2.master,
                belt: p2.belt,
                weight: p2.weight,
                district: p2.districtName
              }
            })

            used.add(String(p1._id))
            used.add(String(p2._id))
            matchCount++
            found = true
            break
          }
          if (found) break
        }

        if (!found) break
      }

      console.log(`  Result: ${matchCount} matches created`)
    })

    // Count unmatched
    const unmatched = people.length - (matches.length * 2)

    console.log(`\n📈 FINAL RESULT:`)
    console.log(`  ✅ Matches Created: ${matches.length}`)
    console.log(`  👥 Players Matched: ${matches.length * 2}`)
    console.log(`  ⚠️ Players Unmatched: ${unmatched}`)
    console.log(`  (Unmatched = no same-age partner with different master)\n`)

    res.json({ 
      matches,
      total: people.length,
      matched: matches.length * 2,
      unmatched,
      criteria: '⭐ STRICT: Same Age + Different Master (PRIORITY) ⭐'
    })
  } catch (err) {
    console.error('Error generating matches:', err)
    res.status(500).json({ error: err.message })
  }
});

module.exports = router;
