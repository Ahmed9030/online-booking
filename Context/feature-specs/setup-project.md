# Project Setup Specification

Project Name:
Barbershop Booking SaaS

Goal:
Prepare the complete development environment and project foundation only.
Do NOT build any features, pages, APIs, business logic, database schema, or authentication flows yet.

The objective is to have the project fully installed, configured, and ready for development.

==================================================
TECH STACK
==================================================

Frontend:
- Next.js 16
- App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- next-intl
- TanStack Query
- Zustand
- Axios
- React Hook Form
- Zod
- Lucide React

Backend:
- Laravel 13
- PHP 8.3+
- Laravel Sanctum
- PostgreSQL
- Database Queue Driver

Infrastructure:
- PostgreSQL 17
- Docker
- Docker Compose

Language:
- Arabic First
- RTL Support
- English ready for future expansion

==================================================
MONOREPO STRUCTURE
==================================================

root/
├── frontend/
├── backend/
├── docs/

==================================================
BACKEND SETUP
==================================================

Create Laravel 13 project.

Install and configure:

- Laravel Sanctum
- PostgreSQL support
- Database Queue
- API mode

Prepare folders:

app/
├── Actions
├── Services
├── Repositories
├── Policies
├── Events
├── Jobs
├── Enums

routes/api/v1/
├── auth.php
├── public.php
├── owner.php
├── staff.php
├── customer.php
├── admin.php
├── internal.php

Requirements:

- API Versioning ready
- UTC timezone
- PostgreSQL connection ready
- Queue connection = database
- UUID support ready
- PHPStan ready
- Pint ready

Do NOT create:
- Models
- Migrations
- Controllers
- Business Logic

==================================================
FRONTEND SETUP
==================================================

Create Next.js 16 project.

Requirements:

- App Router
- TypeScript
- Tailwind CSS v4
- ESLint
- Turbopack

Install:

- next-intl
- axios
- @tanstack/react-query
- zustand
- react-hook-form
- zod
- @hookform/resolvers
- shadcn/ui
- lucide-react
- clsx
- tailwind-merge
- class-variance-authority
- date-fns

Configure:

- Arabic locale as default
- English locale prepared
- RTL support
- Cairo font
- Tajawal font

Prepare folders:

src/
├── app
├── components
│   ├── ui
│   ├── booking
│   ├── dashboard
│   ├── forms
│   └── layout
├── features
├── hooks
├── services
├── store
├── lib
├── types
├── i18n

Create only infrastructure files:

- api-client.ts
- query-client.ts
- providers.tsx
- middleware.ts

Do NOT create:
- Pages
- Components
- Forms
- Business Features

==================================================
QUALITY TOOLS
==================================================

Frontend:

- ESLint
- Prettier
- Prettier Tailwind Plugin

Backend:

- Laravel Pint
- PHPStan

==================================================
DOCKER
==================================================

Create:

- docker-compose.yml
- backend Dockerfile
- nginx configuration

Services:

- app (Laravel)
- nginx
- postgres

==================================================
ENVIRONMENT FILES
==================================================

Prepare:

backend/.env.example

frontend/.env.example

Include placeholders only.

==================================================
DELIVERABLE
==================================================

Provide:

1. Installation commands.
2. Complete dependency list.
3. Folder structure.
4. Docker configuration.
5. Environment variables.
6. Verification checklist.

Do not write any business code.
Do not create database schema.
Do not create features.

Only prepare a clean, scalable, production-ready foundation.
If any dependency is unnecessary, explain why before installing it.
