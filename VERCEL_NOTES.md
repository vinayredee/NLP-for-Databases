# Vercel Deployment Notes

## Current Deployment Strategy

Due to Vercel's limitations with Python environments, we're deploying **frontend only** to Vercel.

### Architecture Options

#### Option 1: Frontend on Vercel + Backend/NLP Elsewhere (Recommended)
- **Frontend**: Deploy to Vercel (static React app)
- **Backend**: Deploy to Render, Railway, or Heroku
- **NLP Service**: Deploy to Render or Railway (supports Python)

#### Option 2: All-in-One Alternative Platforms
- **Render**: Supports monorepo with Node.js + Python
- **Railway**: Supports multiple services in one repo
- **Fly.io**: Good for full-stack apps

### Current Vercel Setup

The `vercel.json` is configured to deploy **frontend only**.

**What works:**
- ✅ Frontend UI deployment
- ✅ Static file serving

**What needs separate deployment:**
- ❌ Backend API (Node.js)
- ❌ NLP Service (Python)

### For Full Deployment

**Option A: Use Render (Easiest)**
1. Go to https://render.com
2. Create a new Web Service
3. Connect your GitHub repo
4. Render auto-detects monorepo structure
5. Set environment variables

**Option B: Split Services**
1. Frontend → Vercel
2. Backend → Render/Railway
3. NLP Service → Render/Railway
4. Update frontend API URLs to point to deployed backend

### Environment Variables Needed

For backend deployment (Render/Railway):
```
MONGODB_URI=<your-atlas-connection-string>
NODE_ENV=production
NLP_SERVICE_URL=<deployed-nlp-service-url>
```

For NLP service:
```
PORT=8000
```

## Recommendation

For simplest deployment, use **Render** instead of Vercel:
- Supports Node.js + Python in one repo
- Free tier available
- Auto-detects services
- Easier for full-stack apps
