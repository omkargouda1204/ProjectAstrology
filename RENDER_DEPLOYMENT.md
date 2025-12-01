# 🚀 Render Deployment Guide - Cosmic Astrology

## Deployment Status
- ✅ Code pushed to GitHub (`main` branch)
- ✅ `render.yaml` configuration created
- ✅ `package.json` configured for Node.js

## How to Deploy on Render

### Step 1: Connect GitHub Repository
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Select "Connect a repository"
4. Choose your GitHub account and select the "Astrology" repository

### Step 2: Configure Service
The `render.yaml` file is already configured with:
```yaml
services:
  - type: web
    name: cosmic-astrology
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node server.js
```

### Step 3: Environment Variables
Add these environment variables in Render dashboard:

**Database (Supabase):**
- `SUPABASE_URL=https://lpcviiavefxepvtcedxs.supabase.co`
- `SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (from .env)
- `SUPABASE_STORAGE_BUCKET=astrology`

**Email Configuration:**
- `EMAIL_HOST=smtp.gmail.com`
- `EMAIL_PORT=587`
- `EMAIL_USER=bhojanaxpress@gmail.com`
- `EMAIL_PASSWORD=wogz xosm yqvp prwa`
- `EMAIL_FROM=Cosmic Astrology <bhojanaxpress@gmail.com>`

**Admin & Security:**
- `ADMIN_PASSWORD=Admin@12`
- `JWT_SECRET=cosmic-astrology-secret-key-2025`
- `NODE_ENV=production`
- `PORT=3000`

**OpenAI (Optional):**
- `OPENAI_API_KEY=` (leave empty if not using)

**CORS:**
- `CORS_ORIGIN=*` (or your domain)

### Step 4: Deploy
1. Render will automatically:
   - Pull latest code from GitHub
   - Run `npm install` to install dependencies
   - Start the server with `node server.js`

2. Once deployment completes, you'll get a public URL like:
   - `https://cosmic-astrology-xxxxx.onrender.com`

### Step 5: Verify Deployment
Test these endpoints:
```bash
# Health check
curl https://your-render-url/health

# Reviews API
curl https://your-render-url/api/reviews?active=true

# Chatbot
curl -X POST https://your-render-url/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message":"location"}'
```

## Features Deployed

✅ **Reviews System**
- Database integration with Supabase
- Admin CRUD operations
- Website carousel display

✅ **Chatbot with Real Data**
- Pulls from business_info table
- Dynamic responses
- Real business contact information

✅ **Background Removal**
- @imgly library for logo processing
- Automatic transparent PNG generation
- Cloud storage upload

✅ **File Upload**
- Supabase cloud storage integration
- Progress logging
- Error handling with fallbacks

## Troubleshooting

### Build Error: "package.json not found"
✅ **Fixed** - render.yaml now configured correctly

### Port Issues
✅ **Fixed** - Render automatically handles port binding

### Database Connection Errors
- Verify SUPABASE_URL and SUPABASE_KEY in environment variables
- Check Supabase project is active

### File Upload Not Working
- Verify SUPABASE_STORAGE_BUCKET is set
- Check bucket permissions in Supabase dashboard

## Local Development

To test locally before pushing:
```bash
# Install dependencies
npm install

# Start server
node server.js

# Server runs on http://localhost:3000
```

## Monitoring Deployment

### View Logs:
1. Go to Render dashboard
2. Click on your service
3. Select "Logs" tab to see real-time server output

### Common Log Messages (Normal):
```
✅ Background removal library loaded successfully (@imgly/background-removal-node)
ℹ️  Sharp not available - using Canvas API fallback for background removal
🌙 Cosmic Astrology Backend Server
Status: Running
Port: 3000
```

## Next Steps After Deployment

1. **Update Domain (Optional)**
   - Point your custom domain to Render URL
   - Update `CORS_ORIGIN` if using custom domain

2. **Monitor Performance**
   - Check Render dashboard for CPU/Memory usage
   - Review error logs regularly

3. **Add More Reviews**
   - Admin panel: http://your-render-url/admin
   - Reviews tab: Add/edit/delete reviews

4. **Customize Chatbot**
   - Edit business_info table in Supabase
   - Responses will update automatically

---

**Deployment Ready!** 🚀 All code is committed and pushed to GitHub. Render will automatically detect changes and redeploy.
