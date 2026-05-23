# Certificate Generator

A web application for bulk PDF certificate generation. Users design certificate templates via a drag-and-drop editor, configure element positions (name, number, QR, signatures, logos), and generate certificates for multiple recipients at once.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 13, PHP 8.4 |
| Frontend | React 19, TypeScript, Inertia.js |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | MySQL / MariaDB |
| Build Tool | Vite |
| PDF Engine | FPDF + FPDI |
| Server | Laravel Octane (RoadRunner) |

## Features

- **Template Designer** — Drag-and-drop canvas editor (Fabric.js) for designing certificate layouts with precise mm positioning
- **Project Management** — Multi-step wizard to configure certificates, numbering, email templates, and training materials
- **Bulk Generation** — Generate PDFs for all recipients at once with auto-incrementing certificate numbers
- **QR Code Verification** — Each certificate includes a scannable QR code linking to a public verification page
- **Excel Import** — Bulk import recipients from XLSX files with validation
- **Email Delivery** — Automated email sending with customizable templates and PDF attachments
- **Role-Based Access** — Admin, operator, and viewer roles via spatie/laravel-permission
- **Certificate Management** — Search, filter, revoke, regenerate, and bulk download (ZIP)

## Requirements

- PHP >= 8.3
- Composer
- Node.js >= 18
- MySQL / MariaDB

## Quick Start

```bash
# Clone and install dependencies
git clone <repository-url>
cd certificate-gen

# Setup (env, key, migrate, npm, build)
composer run setup

# Start development server
composer run dev
```

The `setup` script handles:
1. Installing Composer dependencies
2. Creating `.env` from `.env.example`
3. Generating application key
4. Running database migrations
5. Installing NPM dependencies
6. Building frontend assets

## Default Credentials

After running migrations, a default admin user is seeded:

| Email | Password |
|-------|----------|
| admin@example.com | password |

## Development

```bash
# Start dev server (Octane + queue + logs + Vite)
composer run dev

# Run tests
composer run test

# Format code with Pint
vendor/bin/pint
```

## Project Structure

```
storage/app/public/
├── templates/{id}/background.png
├── projects/{id}/
│   ├── logos/
│   └── signatures/
└── certificates/{id}/
    ├── PSDP-001.pdf
    └── ...
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
DB_DATABASE=certificate_gen
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=log          # Use 'smtp' for production
MAIL_HOST=mailpit        # Local mail catcher
```

## Testing

```bash
# Full test suite
php artisan test

# With coverage
php artisan test --coverage
```

116 tests passing across Unit, Feature (Templates, Projects, Recipients, Certificates, Email, Excel Import).

## License

MIT
