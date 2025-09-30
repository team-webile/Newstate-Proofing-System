# Server Configuration for Static File Serving

## Problem
Uploaded images are returning 404 errors because Next.js is not serving static files from the `public/uploads` directory properly.

## Solutions Applied

### 1. Updated Next.js Configuration (`next.config.mjs`)
- Added rewrites for `/uploads/:path*`
- Added cache headers for uploaded files
- Configured static file serving

### 2. Created Fallback API Route (`app/uploads/[...path]/route.ts`)
- Serves uploaded files directly from filesystem
- Handles proper content types
- Includes cache headers

## Server Deployment Steps

### 1. Rebuild and Deploy
```bash
# On your server
npm run build
pm2 restart all
# OR
npm start
```

### 2. Verify File Permissions
```bash
# Check if uploads directory exists and has proper permissions
ls -la public/uploads/
chmod -R 755 public/uploads/
```

### 3. Test File Access
After deployment, test these URLs:
- `https://preview.devnstage.xyz/uploads/projects/254d39bf-4d1a-4d68-b598-a13df874769e/versions/V1/dc11bade-d2cb-4ca9-be0b-fb26c4b1688d.jpg`
- `https://preview.devnstage.xyz/uploads/projects/254d39bf-4d1a-4d68-b598-a13df874769e/versions/V1/cda8296b-83ab-4e98-b373-a6c2a881112b.jpeg`

### 4. Nginx Configuration (if using Nginx)
If you're using Nginx as a reverse proxy, add this to your nginx config:

```nginx
server {
    listen 80;
    server_name preview.devnstage.xyz;
    
    # Serve static files directly
    location /uploads/ {
        alias /path/to/your/app/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # Proxy everything else to Next.js
    location / {
        proxy_pass http://preview.devnstage.xyz;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Apache Configuration (if using Apache)
Add this to your `.htaccess` or virtual host:

```apache
<Directory "/path/to/your/app/public/uploads">
    Options -Indexes
    AllowOverride None
    Require all granted
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</Directory>
```

## Troubleshooting

### If files still return 404:
1. Check if files exist: `ls -la public/uploads/projects/254d39bf-4d1a-4d68-b598-a13df874769e/versions/V1/`
2. Check file permissions: `chmod 644 public/uploads/projects/*/versions/*/*`
3. Restart your server: `pm2 restart all`
4. Check server logs: `pm2 logs`

### Alternative Solution
If the above doesn't work, you can serve files through a dedicated API route by updating the file URLs in your upload response to use `/api/uploads/` instead of `/uploads/`.
