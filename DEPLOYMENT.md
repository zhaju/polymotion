# GitHub Pages Deployment Guide for Polymotion

## Prerequisites
1. Create a GitHub account if you don't have one
2. Install Git if not already installed

## Steps to Deploy

### 1. Configure Git (if not already done)
```bash
git config --global user.name "Your GitHub Username"
git config --global user.email "your-email@example.com"
```

### 2. Create Initial Commit
```bash
git commit -m "Initial commit: Polymotion dark mode responsive dashboard"
```

### 3. Create GitHub Repository
1. Go to https://github.com
2. Click "New" to create a new repository
3. Name it "polymotion"
4. Don't initialize with README (since we already have files)
5. Click "Create repository"

### 4. Link Local Repository to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/polymotion.git
git branch -M main
git push -u origin main
```

### 5. Deploy to GitHub Pages
```bash
npm run deploy
```

### 6. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Select "gh-pages" branch
6. Click "Save"

### 7. Access Your Site
Your site will be available at: `https://YOUR_USERNAME.github.io/polymotion`

## Project Configuration

The project has been configured with:
- **homepage**: Set in `package.json` for GitHub Pages
- **base**: Set in `vite.config.js` for correct asset paths
- **deploy scripts**: Added to `package.json` for easy deployment
- **gh-pages package**: Installed for automated deployment

## Re-deploying Changes

After making changes to your code:
```bash
git add .
git commit -m "Description of your changes"
git push origin main
npm run deploy
```

The `npm run deploy` command will:
1. Build the project (`npm run build`)
2. Deploy the `dist` folder to the `gh-pages` branch
3. GitHub Pages will automatically update your live site

## Features Deployed

Your deployed site includes:
- ✅ Dark/Light mode toggle with system preference detection
- ✅ Responsive design that works on all devices  
- ✅ Dark mode responsive borders, table headers, and zebra striping
- ✅ Real-time Polymarket data integration
- ✅ Blue accent colors in dark mode
- ✅ Persistent theme preferences
- ✅ Smooth transitions between themes

## Troubleshooting

If the site doesn't load correctly:
1. Check that the GitHub Pages source is set to "gh-pages" branch
2. Verify the repository is public
3. Wait a few minutes for changes to propagate
4. Check the Actions tab for any deployment errors