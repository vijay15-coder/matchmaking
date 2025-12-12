# MERN Backend

## Setup
1. cd backend
2. npm install
3. Create a .env file with:
   MONGO_URI=<your mongo connection string>
   PORT=5000

4. Start server:
   npm run dev

APIs:
- POST /api/person      -> Add person (JSON body)
- GET  /api/person      -> Get list (supports query filters like ?name=John)
- POST /api/person/upload -> Upload Excel (.xlsx) file with headers matching Person fields
- DELETE /api/person/:id -> Delete person
