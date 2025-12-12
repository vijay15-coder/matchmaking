import React, { useState } from 'react'
import AddPersonForm from './components/AddPersonForm'
import FilterBar from './components/FilterBar'
import PeopleList from './components/PeopleList'
import ExcelUpload from './components/ExcelUpload'
import MatchMaker from './components/MatchMaker'

export default function App(){
  const [filters, setFilters] = useState({})
  return (
    <div className="container">
      <h1>🥋 Martial Arts Manager</h1>
      <div className="grid">
        <div className="card">
          <h2>➕ Add Member</h2>
          <AddPersonForm />
          <h2>📊 Import from Excel</h2>
          <ExcelUpload />
        </div>

        <div className="card">
          <h2>🔍 Search & Filter</h2>
          <FilterBar setFilters={setFilters} />
          <h2>👥 Members List</h2>
          <PeopleList filters={filters} />
        </div>
      </div>

      <div className="card" style={{marginTop: 25}}>
        <h2>⚔️ 1v1 Match Maker</h2>
        <MatchMaker />
      </div>
    </div>
  )
}

