# Implementation Plan - Certificate Generator App

## 1. Project Overview

Aplikasi web untuk mengenerate sertifikat PDF secara massal. User mendesain template sertifikat via drag-and-drop editor, mengatur posisi elemen (nama, nomor, QR, tanda tangan, logo), lalu generate sertifikat untuk banyak penerima sekaligus.

### Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Laravel 13, PHP 8.4 |
| Frontend | React 19, TypeScript, Inertia.js |
| Styling | Tailwind CSS + shadcn/ui |
| Database | MySQL / MariaDB |
| Build Tool | Vite |

---

## 2. Dependencies

### Backend (Composer)

```json
{
    "php": "^8.4",
    "laravel/framework": "^13.0",
    "laravel/breeze": "^2.0",
    "inertiajs/inertia-laravel": "^1.0",
    "setasign/fpdf": "^1.8",
    "setasign/fpdi": "^3.0",
    "simplesoftwareio/simple-qrcode": "^4.0",
    "maatwebsite/excel": "^3.1",
    "spatie/laravel-permission": "^6.0",
    "tightenco/ziggy": "^2.0"
}
```

| Package | Fungsi |
|---------|--------|
| `laravel/breeze` | Auth scaffolding dengan Inertia + React |
| `inertiajs/inertia-laravel` | Bridge Laravel ↔ React tanpa API terpisah |
| `setasign/fpdf` | PDF generation dengan positioning presisi mm |
| `setasign/fpdi` | Import existing PDF sebagai template |
| `simplesoftwareio/simple-qrcode` | Generate QR code |
| `maatwebsite/excel` | Import Excel untuk bulk recipient |
| `spatie/laravel-permission` | Role & permission (admin, operator, viewer) |
| `tightenco/ziggy` | Share Laravel routes ke frontend |

### Frontend (NPM)

```json
{
    "@inertiajs/react": "^2.0",
    "react": "^19.0",
    "react-dom": "^19.0",
    "typescript": "^5.0",
    "fabric": "^6.0",
    "react-dropzone": "^14.0",
    "react-hook-form": "^7.0",
    "@hookform/resolvers": "^3.0",
    "zod": "^3.0",
    "@tanstack/react-table": "^8.0",
    "lucide-react": "^0.400",
    "tailwindcss": "^4.0",
    "class-variance-authority": "^0.7",
    "clsx": "^2.0",
    "tailwind-merge": "^2.0",
    "sonner": "^1.0",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-tooltip": "latest",
    "@radix-ui/react-popover": "latest",
    "@radix-ui/react-label": "latest",
    "@radix-ui/react-slot": "latest"
}
```

| Package | Fungsi |
|---------|--------|
| `fabric` | Canvas drag-and-drop untuk template designer |
| `react-dropzone` | File upload (background, logo, tanda tangan) |
| `react-hook-form` + `zod` | Form handling & validation |
| `@tanstack/react-table` | Data table dengan sorting, filtering, pagination |
| `lucide-react` | Icon library |
| `sonner` | Toast notification |
| `@radix-ui/*` | Primitif UI untuk shadcn/ui |
| `class-variance-authority` + `clsx` + `tailwind-merge` | Utility untuk shadcn/ui |

---

## 3. Database Schema

### ERD Overview

```
users
  ↓ (created_by)
templates
  ↓ (template_id)              ↓ (template_id)
template_elements          projects
                              ↓ (project_id)
                    ┌─────────┼─────────┬──────────────┐
           project_signatures  project_logos  training_materials  recipients
```

### Table Definitions

#### `users`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT PK | Primary key |
| name | VARCHAR(255) | Nama user |
| email | VARCHAR(255) | Email (unique) |
| password | VARCHAR(255) | Hashed password |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

> **Note:** Roles (admin, operator, viewer) are managed via `spatie/laravel-permission` tables instead of a `role` column.

#### `templates`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT PK | Primary key |
| name | VARCHAR(255) | Nama template |
| background_image | VARCHAR(500) | Path file background (PNG/JPG) |
| page_width | DECIMAL(8,2) | Lebar halaman dalam mm |
| page_height | DECIMAL(8,2) | Tinggi halaman dalam mm |
| orientation | ENUM('landscape','portrait') | Orientasi halaman |
| created_by | BIGINT FK | Foreign key ke users.id |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `template_elements`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT PK | Primary key |
| template_id | BIGINT FK | Foreign key ke templates.id |
| type | ENUM('title','recipient_name','date','certificate_number','qr_code','signature','logo') | Tipe elemen |
| label | VARCHAR(255) | Label deskriptif |
| x | DECIMAL(8,2) | Posisi X dalam mm |
| y | DECIMAL(8,2) | Posisi Y dalam mm |
| width | DECIMAL(8,2) | Lebar dalam mm |
| height | DECIMAL(8,2) | Tinggi dalam mm |
| font_size | INT NULL | Ukuran font (pt), null untuk QR/logo |
| font_family | VARCHAR(100) NULL | Font family, null untuk QR/logo |
| font_color | VARCHAR(7) NULL | Warna font (hex), null untuk QR/logo |
| font_style | ENUM('normal','bold','italic') NULL | Style font |
| text_align | ENUM('left','center','right') NULL | Alignment teks |
| sort_order | INT | Urutan elemen |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `projects`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT PK | Primary key |
| name | VARCHAR(255) | Nama project |
| template_id | BIGINT FK | Foreign key ke templates.id |
| certificate_prefix | VARCHAR(100) | Prefix nomor sertifikat (misal: "psdp") |
| certificate_digit_count | TINYINT | Jumlah digit increment (3 atau 4) |
| certificate_next_number | INT | Counter auto-increment berikutnya |
| certificate_date | DATE NULL | Tanggal sertifikat (null = hari ini) |
| title_text | VARCHAR(500) NULL | Judul sertifikat |
| email_subject | VARCHAR(500) NULL | Subject email |
| email_body | TEXT NULL | Body email (HTML template) |
| status | ENUM('draft','active','completed') | Status project |
| created_by | BIGINT FK | Foreign key ke users.id |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Variables email template:** `{nama}`, `{nomor_sertifikat}`, `{tanggal}`, `{nama_project}`

#### `project_signatures`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT PK | Primary key |
| project_id | BIGINT FK | Foreign key ke projects.id |
| template_element_id | BIGINT FK | Foreign key ke template_elements.id (area signature) |
| signature_image | VARCHAR(500) | Path file tanda tangan |
| signer_name | VARCHAR(255) | Nama penanda tangan |
| signer_title | VARCHAR(255) | Jabatan penanda tangan |
| sort_order | TINYINT | Urutan tanda tangan (1-4) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `project_logos`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT PK | Primary key |
| project_id | BIGINT FK | Foreign key ke projects.id |
| template_element_id | BIGINT FK | Foreign key ke template_elements.id (area logo) |
| logo_image | VARCHAR(500) | Path file logo |
| sort_order | TINYINT | Urutan logo |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `training_materials`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT PK | Primary key |
| project_id | BIGINT FK | Foreign key ke projects.id (unique) |
| title | VARCHAR(500) | Judul materi pelatihan |
| description | TEXT NULL | Deskripsi materi |
| columns | JSON | Definisi kolom tabel (array of string) |
| rows | JSON | Data baris tabel (array of object) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Format JSON columns:** `["No", "Materi", "Nilai", "Keterangan"]`
**Format JSON rows:** `[{"No":"1","Materi":"First Aid","Nilai":"90","Keterangan":"Lulus"}]`

#### `recipients`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT PK | Primary key |
| project_id | BIGINT FK | Foreign key ke projects.id |
| name | VARCHAR(255) | Nama penerima |
| email | VARCHAR(255) | Email penerima |
| certificate_number | VARCHAR(255) UNIQUE | Nomor sertifikat unik (misal: "psdp/001") |
| certificate_path | VARCHAR(500) NULL | Path file PDF yang di-generate |
| status | ENUM('pending','generated','sent','revoked') | Status sertifikat |
| email_status | ENUM('pending','sent','failed') | Status pengiriman email |
| email_sent_at | TIMESTAMP NULL | Waktu email terkirim |
| revoked_at | TIMESTAMP NULL | Waktu revoke |
| revoke_reason | VARCHAR(500) NULL | Alasan revoke |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `settings`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT PK | Primary key |
| key | VARCHAR(100) UNIQUE | Key setting |
| value | TEXT | Value setting |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Settings default:**
- `app_url` — Domain aplikasi (untuk URL sertifikat)
- `org_name` — Nama organisasi
- `org_default_logo` — Logo default organisasi

---

## 4. API Endpoints / Routes

### Auth

| Method | URI | Description |
|--------|-----|-------------|
| GET/POST | `/login` | Login |
| POST | `/logout` | Logout |
| GET/POST | `/register` | Register (admin only) |

### Dashboard

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/` | Dashboard home |

### Templates

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/templates` | List templates |
| GET | `/templates/create` | Form create template |
| POST | `/templates` | Store template |
| GET | `/templates/{id}` | Show template detail |
| GET | `/templates/{id}/edit` | Edit template (designer) |
| PUT | `/templates/{id}` | Update template |
| DELETE | `/templates/{id}` | Delete template |
| POST | `/templates/{id}/background` | Upload background image |
| POST | `/templates/{id}/elements` | Save/update elements |
| GET | `/templates/{id}/preview` | Preview template |

### Projects

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/projects` | List projects |
| GET | `/projects/create` | Form create project |
| POST | `/projects` | Store project |
| GET | `/projects/{id}` | Show project detail |
| GET | `/projects/{id}/edit` | Edit project |
| PUT | `/projects/{id}` | Update project |
| DELETE | `/projects/{id}` | Delete project |

### Project Signatures

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/projects/{id}/signatures` | List signatures |
| POST | `/projects/{id}/signatures` | Add signature |
| PUT | `/projects/{id}/signatures/{sigId}` | Update signature |
| DELETE | `/projects/{id}/signatures/{sigId}` | Remove signature |

### Project Logos

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/projects/{id}/logos` | List logos |
| POST | `/projects/{id}/logos` | Add logo |
| PUT | `/projects/{id}/logos/{logoId}` | Update logo |
| DELETE | `/projects/{id}/logos/{logoId}` | Remove logo |

### Training Materials

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/projects/{id}/training-material` | Get training material |
| POST | `/projects/{id}/training-material` | Create/update training material |
| PUT | `/projects/{id}/training-material` | Update training material |

### Recipients

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/projects/{id}/recipients` | List recipients |
| POST | `/projects/{id}/recipients` | Add single recipient |
| POST | `/projects/{id}/recipients/import` | Import from Excel |
| PUT | `/projects/{id}/recipients/{recId}` | Update recipient |
| DELETE | `/projects/{id}/recipients/{recId}` | Remove recipient |

### Certificate Generation

| Method | URI | Description |
|--------|-----|-------------|
| POST | `/projects/{id}/generate` | Generate all certificates |
| POST | `/projects/{id}/generate/{recId}` | Generate single certificate |
| POST | `/projects/{id}/regenerate/{recId}` | Re-generate certificate |

### Certificate Management

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/certificates` | List all certificates (search/filter) |
| GET | `/certificates/{id}/download` | Download individual PDF |
| GET | `/projects/{id}/download-zip` | Bulk download ZIP |
| POST | `/certificates/{id}/revoke` | Revoke certificate |
| POST | `/certificates/{id}/resend-email` | Re-send email |

### Public (no auth)

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/cert/{certificate_number}` | Digital certificate viewer |
| GET | `/cert/{certificate_number}/download` | Download PDF |

### Email Settings

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/settings/email` | Email template settings |
| PUT | `/settings/email` | Update email settings |

### Settings

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/settings` | General settings |
| PUT | `/settings` | Update settings |

---

## 5. Frontend Pages

### Page Structure

```
/pages
  /Dashboard.tsx
  /auth
    /Login.tsx
  /templates
    /Index.tsx          — List templates
    /Create.tsx         — Create template form
    /Designer.tsx       — Drag-and-drop template designer
    /Show.tsx           — Template detail & preview
  /projects
    /Index.tsx          — List projects
    /Create.tsx         — Create project (step wizard)
    /Show.tsx           — Project detail
    /Edit.tsx           — Edit project
    /Signatures.tsx     — Manage signatures
    /Logos.tsx          — Manage logos
    /Recipients.tsx     — Manage recipients (manual + import)
    /TrainingMaterial.tsx — Input training materials
    /Generate.tsx       — Generate & preview
  /certificates
    /Index.tsx          — All certificates (search/filter)
    /Show.tsx           — Certificate detail
  /settings
    /Index.tsx          — General settings
    /Email.tsx          — Email template settings
```

### Template Designer Page (Fabric.js Canvas)

**Fitur:**
- Canvas menampilkan background image sebagai lapisan dasar
- Sidebar berisi daftar elemen yang bisa ditambahkan (title, name, date, number, QR, signature, logo)
- User drag elemen dari sidebar ke canvas
- Setiap elemen di canvas bisa di-drag, resize, dan diatur propertinya
- Panel properti di kanan menampilkan pengaturan elemen terpilih (font, ukuran, warna, alignment)
- Koordinat dan ukuran dalam satuan mm
- Tombol "Simpan" menyimpan semua posisi elemen ke backend

### Project Create Wizard

**Step 1:** Info dasar (nama project, pilih template)
**Step 2:** Upload logo & atur posisi (berdasarkan area logo di template)
**Step 3:** Upload tanda tangan & isi nama/jabatan (berdasarkan area signature di template)
**Step 4:** Konfigurasi nomor sertifikat (prefix, jumlah digit)
**Step 5:** Setting email (subject, body template)
**Step 6:** Input materi pelatihan (structured form + custom table)

---

## 6. Implementation Phases

### ✅ Phase 1: Project Setup & Authentication (Completed)

**Goals:** Scaffold project, setup auth, roles, base layout

**Completed Tasks:**
1. ✅ Created Laravel 13 project with PHP 8.4
2. ✅ Installed all composer dependencies (breeze, inertia, fpdf, fpdi, qrcode, excel, permission, ziggy)
3. ✅ Installed all npm dependencies (react 19, typescript, fabric, shadcn/ui, etc.)
4. ✅ Setup Laravel Breeze with Inertia + React + TypeScript
5. ✅ Configured Tailwind CSS v4 + shadcn/ui (base-nova style)
6. ✅ Setup spatie/laravel-permission, created 3 roles (admin, operator, viewer) with seeder
7. ✅ Created database migrations for all 8 tables (templates, template_elements, projects, project_signatures, project_logos, training_materials, recipients, settings)
8. ✅ Created all Eloquent models with relationships
9. ✅ Built base layout dashboard with sidebar navigation + header + user dropdown
10. ✅ Seeded admin user default (admin@example.com / password)
11. ✅ Configured Ziggy for route sharing + role middleware
12. ✅ Full build (client + SSR) compiles without errors

**Deliverables:**
- ✅ Project berjalan di local
- ✅ Login/logout berfungsi
- ✅ Dashboard layout dengan sidebar
- ✅ Role middleware aktif
- ✅ Full build (client + SSR) clean

---

### ✅ Phase 2: Template Designer (Completed)

**Goals:** User bisa membuat template dengan drag-and-drop canvas editor

**Completed Tasks:**
1. ✅ Created TemplateController with full CRUD (index, create, store, show, designer, update, destroy)
2. ✅ Created StoreTemplateRequest & UpdateTemplateRequest with validation
3. ✅ Created Form Requests for template validation (name, page size, orientation, background image)
4. ✅ Registered all template routes in web.php (12 routes: index, create, store, show, designer, update, destroy, background, elements, preview)
5. ✅ Built **Template Designer page** menggunakan Fabric.js v7:
   - Render background image di canvas
   - Sidebar: daftar tipe elemen (title, name, date, number, QR, signature, logo)
   - Klik elemen di sidebar → add ke canvas
   - Select object → panel properti muncul (posisi, ukuran, font, warna, alignment)
   - Resize handle di setiap object
   - Konversi pixel ↔ mm berdasarkan DPI 96
   - Save: kirim semua posisi/ukuran elemen ke backend via POST
6. ✅ Halaman list templates (grid card dengan thumbnail, name, orientation, creator, actions)
7. ✅ Halaman create template (upload background image via react-dropzone, input page size, orientation select)
8. ✅ Preview template (render elemen overlay di atas background dengan posisi proporsional)
9. ✅ Edit template (load existing elements ke Fabric.js canvas)
10. ✅ Delete template (dengan konfirmasi dialog + validasi relasi project)
11. ✅ Created storage structure (templates/{id}/ background images)
12. ✅ Full build (client + SSR) compiles without errors

**Deliverables:**
- ✅ Template CRUD lengkap
- ✅ Canvas editor drag-and-drop berfungsi
- ✅ Semua posisi tersimpan dalam mm
- ✅ Background image upload dengan preview
- ✅ Element properties editor (font, size, color, alignment, position)

---

### ✅ Phase 3: Project Management (Completed)

**Goals:** User bisa membuat project dari template

**Completed Tasks:**
1. ✅ Created ProjectController with full CRUD (index, create, store, show, edit, update, destroy)
2. ✅ Created StoreProjectRequest & UpdateProjectRequest with validation (name, template, date, prefix, digit count, email)
3. ✅ Registered all project routes in web.php (7 routes: index, create, store, show, edit, update, destroy)
4. ✅ Halaman list projects (grid card dengan nama, template, status badge, recipient count, prefix, actions)
5. ✅ Halaman create project — wizard multi-step (5 steps):
   - **Step 1:** Basic Info (nama project, pilih template dengan preview detail)
   - **Step 2:** Certificate Settings (judul sertifikat, date picker untuk tanggal)
   - **Step 3:** Numbering Configuration (prefix, digit count 3/4, live preview format)
   - **Step 4:** Email Settings (subject, body HTML editor dengan variable picker buttons: {nama}, {nomor_sertifikat}, {tanggal}, {nama_project})
   - **Step 5:** Review & save (summary semua konfigurasi)
6. ✅ Halaman detail project (tabs: Overview, Signatures, Logos, Recipients, Materials):
   - **Overview:** Project info, certificate config, template preview dengan element overlay
   - **Signatures:** List signature areas dari template, status assigned/empty
   - **Logos:** List logo areas dari template, status uploaded/empty
   - **Recipients:** Table dengan pagination (nama, email, cert no, status)
   - **Materials:** Tampilkan training material table jika ada
7. ✅ Edit project (pre-filled form dengan semua field: info, cert settings, numbering, email, status)
8. ✅ Delete project (dengan konfirmasi dialog + validasi generated certificates)
9. ✅ Full build (client + SSR) compiles without errors

**Deliverables:**
- ✅ Project CRUD lengkap
- ✅ Wizard multi-step berfungsi (5 steps dengan navigation)
- ✅ Konfigurasi nomor sertifikat berfungsi (prefix + digit count + live preview)

---

### ✅ Phase 4: Logo & Signature Management (Completed)

**Goals:** User bisa upload dan mengatur logo & tanda tangan per project

**Completed Tasks:**
1. ✅ Created StoreProjectLogoRequest & UpdateProjectLogoRequest with validation (image, max 2MB)
2. ✅ Created StoreProjectSignatureRequest & UpdateProjectSignatureRequest with validation (image, signer_name, signer_title)
3. ✅ Added controller methods to ProjectController:
   - `storeLogo` / `updateLogo` / `destroyLogo` — upload, replace, remove logo
   - `storeSignature` / `updateSignature` / `destroySignature` — assign, update, remove signature
4. ✅ Registered all logo & signature routes (6 routes: store, update, destroy for each)
5. ✅ Built interactive **Logo tab** in project detail:
   - Cards per template logo area with Empty/Uploaded badge
   - "Upload" button for empty areas → modal with file upload + preview
   - "Replace" / "Remove" buttons for uploaded logos
   - Click-to-upload dashed zone with image preview
6. ✅ Built interactive **Signature tab** in project detail:
   - Cards per template signature area with Empty/Assigned badge
   - "Assign" button for empty areas → modal with file upload + name + title inputs
   - "Replace" / "Remove" buttons for assigned signatures
   - Image preview with signer name/title display
7. ✅ File upload disimpan ke `storage/app/public/projects/{id}/logos/` dan `signatures/`
8. ✅ File storage mengikuti pattern yang sama dengan TemplateController (Storage::disk('public'))
9. ✅ Duplicate prevention: backend checks that only one logo/signature per template_element_id
10. ✅ Full build (client + SSR) compiles without errors

**Deliverables:**
- ✅ Upload & assign logo berfungsi
- ✅ Upload & assign tanda tangan berfungsi
- ✅ Replace & remove logo/signature berfungsi
- ✅ Duplicate assignment prevention
- ✅ Preview posisi berfungsi

---

### ✅ Phase 5: Recipient Management (Completed)

**Goals:** User bisa input penerima manual dan bulk via Excel

**Completed Tasks:**
1. ✅ Created RecipientController with full CRUD (store, update, destroy, import, downloadTemplate)
2. ✅ Created StoreRecipientRequest & UpdateRecipientRequest with validation (name, email required, email format)
3. ✅ Created Excel import class `RecipientsImport`:
   - Uses `ToCollection` + `WithHeadingRow` from maatwebsite/excel
   - Validates each row (name required, email required & valid format)
   - Skips duplicate emails within same project
   - Auto-assigns certificate numbers with prefix/padded format
   - Tracks imported count per-row error messages
   - Runs in a database transaction
4. ✅ Created `RecipientTemplateExport` for downloadable Excel template with "name" and "email" columns
5. ✅ Registered all recipient routes in web.php (6 routes: index, store, import, template download, update, destroy)
6. ✅ Built full **Recipients tab** in project detail page:
   - Action bar: "Add Recipient" button, "Import Excel" button, "Download Template" button
   - Table with columns: Name, Email, Cert. No., Status (with colored badge + icon), Email Status, Actions
   - "Add Recipient" → dialog modal with name & email inputs
   - "Import Excel" → dialog modal with file upload + download template link
   - Edit recipient (inline dialog, pre-filled, only for pending status)
   - Delete recipient (confirmation, only for pending status)
   - Pagination with existing pattern
7. ✅ Auto-assign certificate number on recipient add/import:
   - Format: `{prefix}/{padded_number}` (e.g., `psdp/001`)
   - Reads `certificate_next_number` from project, increments after assignment
   - Prevents certificate number collisions with database check
8. ✅ Duplicate email validation: checked in both store (single) and import (bulk) with per-project scoping
9. ✅ Full build (client + SSR) compiles without errors

**Deliverables:**
- ✅ Input manual penerima berfungsi
- ✅ Import Excel berfungsi dengan validasi
- ✅ Nomor sertifikat auto-generate
- ✅ Edit & delete penerima (hanya status pending)
- ✅ Download template Excel
- ✅ Duplicate email validation

---

### ✅ Phase 6: Training Materials (Completed)

**Goals:** User bisa input materi pelatihan dengan tabel custom columns

**Completed Tasks:**
1. ✅ TrainingMaterial model & migration sudah ada dari Phase 1 (model with `#[Fillable]`, `$casts` untuk JSON columns/rows, BelongsTo relationship)
2. ✅ Created `StoreTrainingMaterialRequest` with validation (title required, columns required min:1, rows optional array)
3. ✅ Added controller methods to ProjectController:
   - `storeTrainingMaterial` — create or update training material (upsert berdasarkan existence check)
   - `destroyTrainingMaterial` — remove training material
4. ✅ Registered training material routes in web.php:
   - `POST /projects/{project}/training-material` — store/update
   - `DELETE /projects/{project}/training-material` — destroy
5. ✅ Built full **Training Materials tab** di project detail page:
   - **View mode (data exists):** Card header with Edit/Delete buttons, title, description, table preview with alternating row colors
   - **Empty state:** "No training materials yet" with "Add Training Materials" button (replaced Phase 6 placeholder)
   - **Edit/Add mode:** 
     - Title & description inputs
     - Dynamic column builder: input field + "Add" button, columns displayed as removable badges
     - Dynamic row builder: "Add Row" button, inline cell editing with Input components per cell
     - Row deletion via trash icon per row
     - Validation: title required, at least 1 column required, all cells must be filled
     - Save & Cancel buttons
6. ✅ Validation: minimal 1 column (backend + frontend), all cells must be filled (frontend)
7. ✅ Data disimpan sebagai JSON di database (columns array, rows array of objects)

**Deliverables:**
- ✅ Dynamic table builder berfungsi (add/remove columns, add/remove rows, inline cell editing)
- ✅ CRUD materi pelatihan berfungsi (create, read, update, delete via ProjectController)
- ✅ Data tersimpan dalam format JSON
- ✅ Full build (client + SSR) compiles without errors

---

### ✅ Phase 7: Certificate Generation Engine (Completed)

**Goals:** Generate PDF sertifikat dengan semua elemen di posisi yang benar

**Completed Tasks:**
1. ✅ Created `app/Services/CertificateGenerator.php` service class:
   - Load template + background image from storage
   - Load template elements dengan posisi, ukuran, font properties
   - Load project data (logos, signatures, title, date)
   - Load recipient data (nama, nomor sertifikat)
   - Calculate QR value: `{app_url}/cert/{certificate_number}`
   - Generate QR code image menggunakan `simplesoftwareio/simple-qrcode`
   - Font mapping: Arial→Helvetica, Times New Roman→Times, Courier New→Courier
   - Hex color to RGB conversion for FPDF
   - Error handling dengan try/catch per recipient
2. ✅ PDF generation menggunakan FPDF:
   - **Halaman 1 — Sertifikat:**
     - Set page size sesuai template (mm) dengan orientasi otomatis
     - Draw background image full page
     - Loop semua template elements (sorted by sort_order):
       - `title` → render teks judul dengan font/size/color/alignment
       - `recipient_name` → render nama penerima
       - `date` → render tanggal sertifikat (format Indonesia)
       - `certificate_number` → render nomor sertifikat
       - `qr_code` → render QR image dari temp file
       - `signature` → render signature image + nama + jabatan di bawah
       - `logo` → render logo image
   - **Halaman 2 — Materi Pelatihan (jika ada):**
     - Fixed layout: judul di tengah, deskripsi, tabel materi
     - Render tabel dari JSON (columns + rows)
     - Styling tabel: header bold, border, alternating row color, auto page break
3. ✅ Simpan PDF ke `storage/app/public/certificates/{project_id}/{certificate_number}.pdf`
4. ✅ Update recipient status → `generated`, path disimpan di `certificate_path`
5. ✅ Error handling: try/catch dengan logging, partial success reporting
6. ✅ Added controller methods to ProjectController:
   - `generate(Project)` — Bulk generate all pending recipients
   - `generateSingle(Project, Recipient)` — Generate single certificate
   - `regenerate(Project, Recipient)` — Re-generate for pending/revoked status
7. ✅ Registered certificate generation routes:
   - `POST /projects/{project}/generate` → `projects.generate`
   - `POST /projects/{project}/generate/{recipient}` → `projects.generate.single`
   - `POST /projects/{project}/regenerate/{recipient}` → `projects.regenerate`
8. ✅ Created Artisan command: `php artisan certificates:generate {project_id}` with progress bar and `--recipient` option
9. ✅ Created Queue job classes:
   - `GenerateCertificateJob` — generates single PDF via queue
   - `BulkGenerateCertificatesJob` — dispatches individual jobs per recipient
10. ✅ Built **Generate tab** di project detail page:
    - Summary card: pending/generated counts with colored badges
    - "Generate All Certificates" button with loading state and spinner
    - Recipient table: name, cert no, status badge, actions per recipient
    - "Generate" button for each pending recipient
    - "PDF" download link for generated certificates
    - "Regenerate" button for revoked certificates
    - Pagination support
11. ✅ Auto-update project status to `active` on first generation
12. ✅ Full build (client + SSR) compiles without errors

**Deliverables:**
- ✅ PDF sertifikat ter-generate dengan semua elemen ter-posisi benar
- ✅ Halaman 2 materi pelatihan ter-render dengan styling tabel
- ✅ File tersimpan di storage dengan path di database
- ✅ Generate single, bulk, dan regenerate via UI dan CLI

---

### ✅ Phase 8: Digital Certificate & Public Viewer (Completed)

**Goals:** Public page untuk melihat sertifikat digital via QR/link

**Completed Tasks:**
1. ✅ Created CertificateController with show() and download() methods:
   - `show(certificateNumber)` — lookup recipient, check status:
     - `generated`/`sent` → render CertificateViewer page with PDF embed
     - `revoked` → render CertificateRevoked page with revocation info
     - not found or `pending` → 404
   - `download(certificateNumber)` — stream PDF as download response
   - Loads `org_name` from settings for page branding
2. ✅ Registered public routes (no auth):
   - `GET /cert/{certificateNumber}` → `cert.show`
   - `GET /cert/{certificateNumber}/download` → `cert.download`
   - QR code in generated PDFs already points to this URL pattern
3. ✅ Built **PublicLayout** — minimal layout for unauthenticated pages:
   - Header with branding + sticky positioning
   - Centered content area (max-w-5xl)
   - Footer with copyright
4. ✅ Built **CertificateViewer page** (resources/js/Pages/Public/CertificateViewer.tsx):
   - PDF embedded via `<iframe>` with 600px height
   - Header: "Digital Certificate" with verified badge + org name
   - Info card: recipient name, certificate number, project, issue date
   - Download button (primary) + Open in New Tab button (secondary)
   - Download URL passed from server via `route('cert.download', certNo)`
5. ✅ Built **CertificateRevoked page** (resources/js/Pages/Public/CertificateRevoked.tsx):
   - Large destructive icon + "Certificate Revoked" title
   - Info card: recipient name, certificate number, revoked date, reason
   - No PDF access or download buttons
6. ✅ Full build (client + SSR) compiles without errors

**Deliverables:**
- ✅ Public viewer berfungsi
- ✅ Revoked page berfungsi
- ✅ Download berfungsi
- ✅ QR code link resolves correctly

---

### ✅ Phase 9: Email Integration (Completed)

**Goals:** Kirim sertifikat otomatis via email setelah generate

**Completed Tasks:**
1. ✅ Created `app/Mail/CertificateGenerated.php` Mailable class:
   - Subject & body dari project settings (`email_subject`, `email_body`)
   - Replace all 4 variables: `{nama}`, `{nomor_sertifikat}`, `{tanggal}`, `{nama_project}`
   - Attach PDF certificate as attachment from storage
   - Include digital certificate URL from `Setting::get('app_url')`
   - Uses `Queueable` trait for deferred sending
2. ✅ Created Blade email template (`resources/views/emails/certificate-generated.blade.php`):
   - Professional HTML email with header, body, call-to-action button, info card, footer
   - Responsive design with inline CSS for email client compatibility
   - Displays recipient name, certificate number, project name
3. ✅ Created `app/Jobs/SendCertificateEmailJob.php` queue job:
   - Dispatches `CertificateGenerated` mailable
   - Updates `email_status` → `sent`, sets `email_sent_at` on success
   - Updates `email_status` → `failed` on error with logging
   - Skips silently if project has no email template configured
4. ✅ Auto-send after generation:
   - `generate()` (bulk) → dispatches `SendCertificateEmailJob` per recipient after successful PDF generation
   - `generateSingle()` → dispatches `SendCertificateEmailJob` for the recipient
   - `regenerate()` → dispatches `SendCertificateEmailJob` for re-generated certificate
5. ✅ Added `sendEmail(Project, Recipient)` controller method for manual per-recipient sending
6. ✅ Added `sendAllEmails(Project)` controller method for batch sending of pending emails
7. ✅ Registered email routes:
   - `POST /projects/{project}/send/{recipient}` → `projects.send-email`
   - `POST /projects/{project}/send-all` → `projects.send-all`
8. ✅ Updated Generate tab in project detail page:
   - Added "Email Status" column with colored badges (Pending/Sent/Failed)
   - "Send" / "Resend" button per generated/sent recipient
   - "Send All Emails" bulk button with loading state
   - "pending email" count badge
   - `handleSendEmail()` and `handleSendAllEmails()` handler functions
9. ✅ `.env` configured with `MAIL_MAILER=log` for development (switch to SMTP for production)
10. ✅ Full build (client + SSR) compiles without errors

**Deliverables:**
- ✅ Email terkirim otomatis setelah generate (single & bulk)
- ✅ Email template customizable via project settings
- ✅ Retry failed emails (resend button)
- ✅ Manual send/resend per recipient
- ✅ Queue-based delivery via SendCertificateEmailJob

---

### ✅ Phase 10: Certificate Management Dashboard (Completed)

**Goals:** Dashboard untuk mengelola semua sertifikat

**Completed Tasks:**
1. ✅ Created certificate list page (`/certificates`):
   - Table with columns: name, certificate number, project, status, email status, date
   - Search by name / certificate number via search input
   - Filter by project (dropdown), status (generated/sent/revoked), email status (pending/sent/failed)
   - Sortable columns (name, cert. no., status, email status, date) with arrow indicators
   - Laravel pagination with preserveScroll
   - Empty state when no results match filters
   - Actions: view detail, download PDF, regenerate, revoke (with disabled states)
2. ✅ Created certificate detail page (`/certificates/{id}`):
   - PDF preview embedded via `<iframe>` with 600px height
   - Info card: recipient name/email, certificate number, project link, template name, created date
   - Status & Delivery card: certificate status badge, email status, sent date, revoked info
   - Actions: download PDF, open in new tab, revoke, regenerate
   - Warning banner for revoked certificates with reason
3. ✅ Revoke certificate:
   - Dialog modal with reason textarea input
   - Validates reason is required (max 500 chars)
   - Updates status → revoked, sets revoked_at & revoke_reason
   - PDF file retained for audit purposes
   - Public link shows CertificateRevoked page with revocation info
4. ✅ Re-generate certificate:
   - Available for pending/revoked status only
   - Generates new PDF via CertificateGenerator
   - Clears revoked_at and revoke_reason on regeneration
   - Available from both list page and detail page
5. ✅ Bulk download ZIP:
   - "Download All" button in Generate tab of project detail page
   - Visible only when generated certificates exist
   - Uses PHP ZipArchive to create ZIP of all project PDFs
   - Files named with certificate number (e.g., `psdp_001.pdf`)
   - Temporary file deleted after download
6. ✅ Individual download:
   - Direct download via `/storage/{certificate_path}` links
   - Public download via `/cert/{certificate_number}/download` route
   - Available from list page, detail page, and generate tab
7. ✅ Dashboard statistics:
   - Real stats: Total Certificates, Templates, Projects, Recipients
   - Additional cards: Emails Sent, Revoked count, Recipients breakdown
   - Recent Activity list with status badges (generated/sent/revoked)
   - Click activity item → navigate to certificate detail
   - Empty state when no activity

**Deliverables:**
- ✅ Full certificate management dashboard
- ✅ Search, filter, sorting berfungsi
- ✅ Revoke, re-generate, download berfungsi
- ✅ Bulk download ZIP berfungsi
- ✅ Dashboard home dengan statistik real & recent activity

---

## 7. Security Considerations

- File upload validation: hanya PNG/JPG untuk image, XLSX untuk Excel
- Max file size: background 10MB, logo/signature 2MB, Excel 5MB
- Filename sanitization
- Auth middleware di semua route kecuali `/cert/*`
- Role permission: viewer hanya bisa view, operator bisa CRUD, admin bisa semua
- Certificate number uniqueness constraint di database
- Rate limiting pada public certificate view

## 8. File Storage Structure

```
storage/app/public/
├── templates/
│   └── {template_id}/
│       └── background.png
├── projects/
│   └── {project_id}/
│       ├── logos/
│       │   ├── logo_1.png
│       │   └── logo_2.png
│       └── signatures/
│           ├── signature_1.png
│           └── signature_2.png
└── certificates/
    └── {project_id}/
        ├── psdp_001.pdf
        ├── psdp_002.pdf
        └── ...
```

## 9. Queue Configuration

Job yang perlu di-queue:
- `GenerateCertificateJob` — generate single PDF
- `BulkGenerateCertificatesJob` — generate semua PDF dalam project
- `SendCertificateEmailJob` — kirim email dengan attachment

Queue driver: `database` (default) atau `redis` untuk performa lebih baik.

## 10. Testing Strategy

### ✅ Testing Phase (Completed)

**116 tests passing, 485 assertions**

### Factories Created (database/factories/):

| Factory | States |
|---------|--------|
| `TemplateFactory` | default |
| `TemplateElementFactory` | title, recipientName, date, certificateNumber, qrCode, signature, logo |
| `ProjectFactory` | active, completed |
| `RecipientFactory` | pending, generated, sent, revoked |
| `ProjectSignatureFactory` | default |
| `ProjectLogoFactory` | default |
| `TrainingMaterialFactory` | default |
| `SettingFactory` | appUrl, orgName |

### Test Suites

**Unit Tests** (`tests/Unit/CertificateGeneratorTest.php` — 9 tests):
- PDF generation returns valid file path with content
- PDF generation with QR code element
- PDF generation with training material second page
- PDF generation with background image
- Graceful handling of missing background image
- PDF generation with signature and logo images
- Helper method: `hexToRgb()` — full/in shorthand, common colors
- Helper method: `mapFont()` — Arial→Helvetica, TNR→Times, Courier New→Courier, fallback
- Helper method: `mapStyle()` — normal→'', bold→B, italic→I, fallback

**Template Feature Tests** (`tests/Feature/TemplateControllerTest.php` — 13 tests):
- Index returns templates list page
- Create returns form
- Store creates template with background upload
- Store validates required fields
- Store validates orientation enum
- Show displays template detail
- Designer page renders
- Update modifies template fields
- Destroy deletes template
- Background upload replaces image
- Elements saves element positions with all typography settings
- Elements replaces old elements on re-save
- Preview shows template
- Unauthenticated access is rejected

**Project Feature Tests** (`tests/Feature/ProjectControllerTest.php` — 14 tests):
- Index returns projects page
- Create returns form with templates
- Store creates project with all fields
- Store validates required fields
- Store validates digit count (3 or 4)
- Show displays project with all relations
- Edit returns form
- Update modifies project
- Destroy deletes project without generated certs
- Destroy fails when project has generated certs
- Logo store uploads and assigns
- Signature store uploads with signer data
- Duplicate logo assignment prevented
- Training material CRUD with column validation

**Recipient Feature Tests** (`tests/Feature/RecipientControllerTest.php` — 12 tests):
- Store creates recipient with auto-numbered certificate
- Store increments certificate_next_number
- Store validates required fields (name, email)
- Store validates email format
- Duplicate email within project is rejected
- Update modifies pending recipient
- Update fails for generated recipient
- Destroy deletes pending recipient
- Destroy fails for generated recipient
- Index returns paginated recipients
- Download template returns valid Excel file
- Unauthenticated access is rejected

**Certificate Management Tests** (`tests/Feature/CertificateManagementTest.php` — 14 tests):
- Index returns page with certificates/projects/filters
- Index filters by status
- Index searches by name
- Index searches by certificate number
- Index sorts by name ascending
- Detail shows certificate info
- Detail 404 for pending status
- Revoke updates status/reason/timestamp
- Revoke validates reason required
- Revoke fails for pending status
- Regenerate creates new PDF, clears revocation data
- Public viewer shows PDF for generated/sent
- Public viewer shows revoked page
- Public 404 for nonexistent cert
- Public 404 for pending cert

**Certificate Generation Tests** (`tests/Feature/CertificateGenerationTest.php` — 11 tests):
- Bulk generate creates PDFs for all pending recipients
- Bulk generate skips already generated recipients
- Bulk generate errors when no pending recipients
- Single generate creates PDF
- Single generate fails for non-pending
- Regenerate replaces old PDF, clears revocation
- Download ZIP contains PDF files
- Download ZIP errors when no generated certs
- Regenerate fails for generated status
- Artisan command generates certificates for project
- Artisan command with `--recipient` option

**Email Tests** (`tests/Feature/EmailTest.php` — 6 tests):
- SendCertificateEmailJob dispatches mailable
- Mailable replaces variables in subject/body
- Send email endpoint queues job
- Send all emails queues for pending deliveries only
- Send email fails without email config
- Email updates status to sent on success

**Excel Import Tests** (`tests/Feature/ExcelImportTest.php` — 7 tests):
- Import creates recipients from CSV
- Import auto-increments certificate numbers
- Import skips duplicate emails
- Import validates required fields
- Import rejects invalid file type
- Import rejects oversized file
- Import with 4-digit number format
