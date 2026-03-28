# Production Deployment Guide

## Quick Deployment Steps

This guide will deploy the admin-to-user call feature with comprehensive logging to production.

### 1. Commit and Push Changes

```bash
# Check what will be committed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add admin-to-user calling with comprehensive logging

- Add initiator_type column to calls table for bidirectional calling
- Implement admin call initiation endpoints in CallsController
- Add mobile API endpoints for receiving admin calls
- Integrate Agora RTC in Chats.tsx with call UI
- Add LogCallRequests middleware for debugging
- Add ListCallRoutes artisan command
- Enhance error logging in frontend and backend"

# Push to remote
git push origin main
```

### 2. SSH to Production Server

```bash
ssh sjamarti@ems-connect.psanguan.com
```

### 3. Deploy on Production

Run these commands on the production server:

```bash
# Navigate to project directory
cd /home/sjamarti/ems-connect.psanguan.com

# Pull latest changes
git pull origin main

# Install dependencies (if any new packages)
composer install --no-dev --optimize-autoloader
npm install

# Run database migration (adds initiator_type column)
php artisan migrate --force

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Rebuild optimized caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Build frontend assets
npm run build

# Fix permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Restart services
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
```

### 4. Verify Deployment

```bash
# Check that routes are registered
php artisan route:list | grep calls

# Should show:
# POST   admin/calls/initiate
# GET    admin/calls/{id}/status
# POST   admin/calls/answer
# POST   admin/calls/end
# GET    admin/calls/incoming

# Use custom command to see all call routes
php artisan routes:call-list

# Monitor logs in real-time
tail -f storage/logs/laravel.log
```

### 5. Test in Browser

1. Go to: `https://emsconnect.online/admin/chats`
2. Open Browser DevTools (F12) → Console tab
3. Select a conversation
4. Click the phone icon
5. Watch for:
   - Console logs showing `[CALLS] Starting call initiation`
   - Network tab showing POST to `/admin/calls/initiate`
   - Response should be 200/201 (not 404)

### 6. Check Logs

On production server:

```bash
# Watch logs for call activity
tail -f storage/logs/laravel.log | grep CALL

# You should see:
# [CALL_REQUEST] Incoming request
# [CALLS] ===== INITIATE CALL ENDPOINT HIT =====
# [CALLS] Admin initiated call to community user
# [CALL_RESPONSE] Response sent
```

## Troubleshooting

### Issue: 404 Route Not Found

```bash
# Clear route cache
php artisan route:clear
php artisan route:cache

# Verify routes exist
php artisan routes:call-list
```

### Issue: Permission Denied

```bash
sudo chown -R www-data:www-data /home/sjamarti/ems-connect.psanguan.com
sudo chmod -R 775 storage bootstrap/cache
```

### Issue: Frontend Not Updated

```bash
# Rebuild frontend
npm run build

# Clear browser cache
# Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

### Issue: Migration Already Ran

```bash
# Check migration status
php artisan migrate:status

# If already ran, you're good to go
```

## Success Criteria

- Route `/admin/calls/initiate` returns 200/201 (not 404)
- Clicking phone icon in Chats creates call record
- Detailed logs appear in `storage/logs/laravel.log`
- Agora channel joins successfully
- Call modal appears
- No JavaScript errors in console

## Rollback (If Needed)

```bash
# Revert to previous commit
git log --oneline -5
git reset --hard PREVIOUS_COMMIT_HASH

# Rollback migration
php artisan migrate:rollback --step=1

# Clear caches
php artisan cache:clear
php artisan route:clear

# Rebuild
npm run build
sudo systemctl restart php8.2-fpm nginx
```
