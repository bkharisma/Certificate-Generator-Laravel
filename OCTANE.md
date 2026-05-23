# Laravel Octane Implementation

## Konfigurasi

### Server
- **Driver**: RoadRunner
- **Port**: 8000 (default)
- **Workers**: 4
- **Max Jobs per Worker**: 500 requests

### Risk Mitigation

#### 1. Memory Management
- **Garbage Collection**: Enabled (threshold: 100MB)
- **Max Requests**: 500 per worker (auto-restart untuk prevent memory leaks)
- **Database Disconnect**: Enabled setelah setiap request

#### 2. State Safety
- **CertificateGenerator**: Stateless - aman untuk Octane
- **No static variables**: Codebase clean dari state persistence
- **No singletons**: Semua service di-resolve per request

#### 3. File Cleanup
- QR code temp files: Auto-cleanup setelah PDF generation
- Uploaded files: Validated dan flushed per request

## Commands

```bash
# Development
composer run dev

# Start Octane manually
php artisan octane:start
php artisan octane:start --port=8080  # Custom port
php artisan octane:start --watch      # Auto-reload on file changes

# Reload workers
php artisan octane:reload

# Stop server
php artisan octane:stop

# Check status
php artisan octane:status
```

## Environment Variables

```env
OCTANE_SERVER=roadrunner
OCTANE_HTTPS=false
OCTANE_WORKERS=4
OCTANE_TASK_WORKERS=2
OCTANE_MAX_REQUESTS=500
```

## Production Notes

1. **Process Manager**: Gunakan supervisor/systemd untuk manage RoadRunner
2. **Health Check**: Endpoint `/up` untuk monitoring
3. **Monitoring**: Track memory usage dan worker restarts
4. **Cache**: Pertimbangkan Redis untuk production (bukan database)
5. **Session**: Pertimbangkan Redis untuk session storage

## Performance Tips

1. Hindari `dd()`, `dump()`, `var_dump()` di production
2. Gunakan `Cache::remember()` untuk query berat
3. Eager load relationships (`with()`)
4. Queue tasks yang berat (PDF generation, email)
