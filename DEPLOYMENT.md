# GitHub Setup Instructions

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `semantic-mongodb-search`
3. Description: "Natural language interface for MongoDB with AI-powered query translation"
4. Choose: **Public** or **Private**
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
cd c:/Users/vinay/.gemini/antigravity/scratch/semantic-mongodb-search
git remote add origin https://github.com/YOUR_USERNAME/semantic-mongodb-search.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Verify Push

Check your GitHub repository page - you should see all files uploaded.

## Step 4: Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Add environment variables:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `NODE_ENV` - Set to `production`
6. Click "Deploy"

## Important Notes

- **MongoDB Atlas Required**: Local MongoDB won't work on Vercel. You need a cloud MongoDB Atlas instance.
- **Vector Search**: Requires MongoDB Atlas M10+ cluster for full functionality.
- **Environment Variables**: Make sure to set `MONGODB_URI` in Vercel dashboard.

## Troubleshooting

If you encounter issues:
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0` (allow all)
- Check Vercel deployment logs for errors
- Verify environment variables are set correctly
