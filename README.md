# Semantic MongoDB Search

A powerful natural language interface for MongoDB databases with AI-powered query translation and semantic search capabilities.

## 🚀 Features

- **Natural Language Queries** - Ask questions in plain English
- **Text-to-MQL Translation** - Converts natural language to MongoDB queries
- **Semantic Vector Search** - AI-powered similarity matching
- **Fallback Search** - Keyword-based fuzzy matching
- **Voice Input** - Speech-to-text query support
- **Export Results** - Download search results as CSV
- **Dynamic Database Connection** - Switch between databases on the fly

## 🏗️ Architecture

```
semantic-mongodb-search/
├── frontend/          # React + Vite UI
├── backend/           # Node.js Express API
└── nlp-service/       # Python FastAPI NLP service
```

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- Axios
- Lucide React (icons)

**Backend:**
- Node.js + Express
- Mongoose (MongoDB ODM)
- Helmet (security)
- Express Rate Limit

**NLP Service:**
- Python FastAPI
- Sentence Transformers
- Uvicorn

## 📋 Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB (local or Atlas)

## 🚀 Local Development

### 1. Clone the repository
```bash
git clone https://github.com/vinayredee/NLP-for-Databases.git
cd NLP-for-Databases
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm start
```

### 3. Setup NLP Service
```bash
cd nlp-service
pip install -r requirements.txt
python main.py
```

### 4. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- NLP Service: http://localhost:8000

## 🌐 Deployment

### Vercel Deployment

1. **Prerequisites:**
   - MongoDB Atlas account (M10+ for vector search)
   - Vercel account
   - GitHub repository

2. **Environment Variables (Vercel):**
   ```
   MONGODB_URI=<your-atlas-connection-string>
   NODE_ENV=production
   ```

3. **Deploy:**
   - Connect your GitHub repo to Vercel
   - Vercel will auto-detect the configuration
   - Set environment variables in Vercel dashboard

## 🔍 How It Works

1. **Text-to-MQL (Primary):** Translates queries like "salary > 5000" into MongoDB queries
2. **Vector Search (Secondary):** Uses AI embeddings for semantic matching
3. **Keyword Search (Fallback):** Fuzzy text matching across all fields

## 📊 Search Examples

- `employee` - Find all employees
- `salary greater than 50000` - Precise query translation
- `usa` - Find records with country USA
- `tech department` - Semantic search for tech-related records

## 🔒 Security Features

- Helmet.js for HTTP headers
- Rate limiting (100 req/15min)
- Regex injection prevention
- Input sanitization

## 📝 License

MIT

## 👤 Author

Your Name

## 🙏 Acknowledgments

- Sentence Transformers for NLP models
- MongoDB Atlas for vector search capabilities
