# 🚀 Excalidraw Deployment Guide

## Deploy to Vercel

### Method 1: Via Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### Method 2: Via GitHub Integration
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure project settings:
   - **Framework Preset**: Other
   - **Build Command**: `./build.sh`
   - **Output Directory**: `excalidraw-app/build`
   - **Install Command**: `yarn install --frozen-lockfile`
   - **Node.js Version**: 20.x

## Deploy to VPS (Docker)

```bash
# Clone repository
git clone <your-repo-url>
cd excalidraw

# Build and run
./deploy.sh vps

# Or manually
docker-compose -f docker-compose.prod.yml up --build -d
```

## Environment Variables

For production deployments, you may want to set:

```bash
VITE_APP_DISABLE_SENTRY=true
VITE_APP_DISABLE_TRACKING=true
VITE_APP_GIT_SHA=<commit-sha>
```

## Troubleshooting

### "No Next.js version detected" Error
- Ensure `"framework": null` is set in `vercel.json`
- Use custom build command `./build.sh`
- Verify Node.js version is set to 20.x

### "Application error" 
- Check SPA routing configuration in `vercel.json`
- Verify `rewrites` section redirects all routes to `/index.html`

### Build Issues
```bash
# Test local build
yarn build

# Debug build
./debug-deploy.sh
```

## Files Structure

```
excalidraw/
├── vercel.json          # Vercel configuration
├── docker-compose.prod.yml  # Docker production config
├── build.sh            # Custom build script for Vercel
├── deploy.sh           # Automated deployment script
├── debug-deploy.sh     # Debug deployment issues
└── excalidraw-app/
    └── build/          # Built static files
```
