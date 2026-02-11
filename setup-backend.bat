@echo off
REM ============================================================
REM OMNICASSION V2.0 - NestJS Backend Setup Script
REM ============================================================
REM This script creates the complete backend structure based on
REM the DEVELOPMENT_PLAN.md architecture specification
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo    OMNICASSION V2.0 - Backend Setup Script
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo [INFO] Node.js and npm are installed.
echo.

REM Set project directory
set PROJECT_DIR=%~dp0backend
echo [INFO] Project will be created at: %PROJECT_DIR%
echo.

REM Check if NestJS CLI is installed globally
where nest >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Installing NestJS CLI globally...
    call npm install -g @nestjs/cli
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install NestJS CLI
        pause
        exit /b 1
    )
)

echo [INFO] NestJS CLI is available.
echo.

REM ============================================================
REM STEP 1: Create NestJS Project
REM ============================================================
echo ============================================================
echo STEP 1: Creating NestJS Project
echo ============================================================

if exist "%PROJECT_DIR%" (
    echo [WARNING] Backend directory already exists.
    set /p OVERWRITE="Do you want to continue? This will add to existing structure. (y/n): "
    if /i "!OVERWRITE!" NEQ "y" (
        echo [INFO] Setup cancelled.
        pause
        exit /b 0
    )
) else (
    echo [INFO] Creating new NestJS project...
    call nest new backend --package-manager npm --skip-git
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create NestJS project
        pause
        exit /b 1
    )
)

cd /d "%PROJECT_DIR%"
echo [INFO] Changed to project directory: %CD%
echo.

REM ============================================================
REM STEP 2: Install Dependencies
REM ============================================================
echo ============================================================
echo STEP 2: Installing Dependencies
echo ============================================================

echo [INFO] Installing core dependencies...
call npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
call npm install @nestjs/event-emitter @nestjs/schedule @nestjs/throttler
call npm install @nestjs/swagger swagger-ui-express
call npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
call npm install @nestjs/bullmq bullmq
call npm install @prisma/client class-validator class-transformer
call npm install bcryptjs uuid slugify
call npm install ioredis meilisearch minio
call npm install helmet compression

echo [INFO] Installing dev dependencies...
call npm install -D prisma @types/passport-jwt @types/passport-local @types/bcryptjs @types/uuid
call npm install -D @types/multer

echo [INFO] Dependencies installed successfully.
echo.

REM ============================================================
REM STEP 3: Initialize Prisma
REM ============================================================
echo ============================================================
echo STEP 3: Initializing Prisma
echo ============================================================

call npx prisma init
echo [INFO] Prisma initialized.
echo.

REM ============================================================
REM STEP 4: Generate NestJS Modules using CLI
REM ============================================================
echo ============================================================
echo STEP 4: Generating NestJS Modules
echo ============================================================

REM --- API GATEWAYS ---
echo [INFO] Generating API Gateway modules...
call nest g module api/admin-gateway --no-spec
call nest g module api/ops-gateway --no-spec
call nest g module api/marketing-gateway --no-spec
call nest g module api/sales-gateway --no-spec
call nest g module api/business-gateway --no-spec
call nest g module api/user-gateway --no-spec
call nest g module api/public-gateway --no-spec

REM --- CORE MODULES ---
echo [INFO] Generating Core modules...
call nest g module core/auth --no-spec
call nest g module core/database --no-spec
call nest g module core/events --no-spec
call nest g module core/lookup --no-spec
call nest g module core/common --no-spec

REM --- DOMAIN MODULES ---
echo [INFO] Generating Domain modules...
call nest g module domain/catalog --no-spec
call nest g module domain/leads --no-spec
call nest g module domain/planning --no-spec
call nest g module domain/operations --no-spec
call nest g module domain/content --no-spec

REM --- INFRASTRUCTURE MODULES ---
echo [INFO] Generating Infrastructure modules...
call nest g module infrastructure/storage --no-spec
call nest g module infrastructure/jobs --no-spec
call nest g module infrastructure/search --no-spec
call nest g module infrastructure/cache --no-spec
call nest g module infrastructure/notifications --no-spec
call nest g module infrastructure/websockets --no-spec
call nest g module infrastructure/resilience --no-spec

echo [INFO] Modules generated successfully.
echo.

REM ============================================================
REM STEP 5: Generate Controllers
REM ============================================================
echo ============================================================
echo STEP 5: Generating Controllers
echo ============================================================

REM --- Admin Gateway Controllers ---
echo [INFO] Generating Admin Gateway controllers...
call nest g controller api/admin-gateway/controllers/users --flat --no-spec
call nest g controller api/admin-gateway/controllers/roles --flat --no-spec
call nest g controller api/admin-gateway/controllers/system-config --flat --no-spec
call nest g controller api/admin-gateway/controllers/audit --flat --no-spec

REM --- Ops Gateway Controllers ---
echo [INFO] Generating Ops Gateway controllers...
REM Compliance Controllers
call nest g controller api/ops-gateway/controllers/kyc --flat --no-spec
call nest g controller api/ops-gateway/controllers/disputes --flat --no-spec
call nest g controller api/ops-gateway/controllers/moderation --flat --no-spec
call nest g controller api/ops-gateway/controllers/vendors --flat --no-spec
call nest g controller api/ops-gateway/controllers/support --flat --no-spec
REM Event Execution Workflow Controllers
call nest g controller api/ops-gateway/controllers/active-events --flat --no-spec
call nest g controller api/ops-gateway/controllers/lead-conversion --flat --no-spec
call nest g controller api/ops-gateway/controllers/requirements --flat --no-spec
call nest g controller api/ops-gateway/controllers/vendor-agreements --flat --no-spec
call nest g controller api/ops-gateway/controllers/invoices --flat --no-spec
call nest g controller api/ops-gateway/controllers/operational-tasks --flat --no-spec
call nest g controller api/ops-gateway/controllers/task-attachments --flat --no-spec
call nest g controller api/ops-gateway/controllers/ops-dashboard --flat --no-spec

REM --- Marketing Gateway Controllers ---
echo [INFO] Generating Marketing Gateway controllers...
call nest g controller api/marketing-gateway/controllers/campaigns --flat --no-spec
call nest g controller api/marketing-gateway/controllers/content --flat --no-spec
call nest g controller api/marketing-gateway/controllers/media --flat --no-spec
call nest g controller api/marketing-gateway/controllers/promotions --flat --no-spec
call nest g controller api/marketing-gateway/controllers/categories --flat --no-spec

REM --- Sales Gateway Controllers ---
echo [INFO] Generating Sales Gateway controllers...
call nest g controller api/sales-gateway/controllers/leads --flat --no-spec
call nest g controller api/sales-gateway/controllers/acquisitions --flat --no-spec
call nest g controller api/sales-gateway/controllers/partnerships --flat --no-spec
call nest g controller api/sales-gateway/controllers/analytics --flat --no-spec

REM --- Business Gateway Controllers ---
echo [INFO] Generating Business Gateway controllers...
call nest g controller api/business-gateway/controllers/profile --flat --no-spec
call nest g controller api/business-gateway/controllers/portfolio --flat --no-spec
call nest g controller api/business-gateway/controllers/services --flat --no-spec
call nest g controller api/business-gateway/controllers/leads --flat --no-spec
call nest g controller api/business-gateway/controllers/reviews --flat --no-spec
call nest g controller api/business-gateway/controllers/analytics --flat --no-spec
call nest g controller api/business-gateway/controllers/calendar --flat --no-spec
REM Vendor Workflow Controllers
call nest g controller api/business-gateway/controllers/agreements --flat --no-spec
call nest g controller api/business-gateway/controllers/tasks --flat --no-spec

REM --- User Gateway Controllers ---
echo [INFO] Generating User Gateway controllers...
REM Core User Controllers
call nest g controller api/user-gateway/controllers/events --flat --no-spec
call nest g controller api/user-gateway/controllers/discovery --flat --no-spec
call nest g controller api/user-gateway/controllers/interactions --flat --no-spec
call nest g controller api/user-gateway/controllers/account --flat --no-spec
REM Planning Suite Controllers
call nest g controller api/user-gateway/controllers/checklists --flat --no-spec
call nest g controller api/user-gateway/controllers/guestlist --flat --no-spec
call nest g controller api/user-gateway/controllers/budget --flat --no-spec
call nest g controller api/user-gateway/controllers/timeline --flat --no-spec
call nest g controller api/user-gateway/controllers/event-vendors --flat --no-spec
REM Wishlists & Memories Controllers
call nest g controller api/user-gateway/controllers/wishlists --flat --no-spec
call nest g controller api/user-gateway/controllers/memories --flat --no-spec

REM --- Public Gateway Controllers ---
echo [INFO] Generating Public Gateway controllers...
call nest g controller api/public-gateway/controllers/webhooks --flat --no-spec
call nest g controller api/public-gateway/controllers/discovery --flat --no-spec
call nest g controller api/public-gateway/controllers/health --flat --no-spec
call nest g controller api/public-gateway/controllers/guest-upload --flat --no-spec
call nest g controller api/public-gateway/controllers/rsvp --flat --no-spec

echo [INFO] Controllers generated successfully.
echo.

REM ============================================================
REM STEP 6: Generate Services
REM ============================================================
echo ============================================================
echo STEP 6: Generating Services
echo ============================================================

REM --- Core Services ---
echo [INFO] Generating Core services...
call nest g service core/database/prisma --flat --no-spec
call nest g service core/auth/auth --flat --no-spec
call nest g service core/auth/token --flat --no-spec

REM --- Lookup Services ---
call nest g service core/lookup/country-lookup --flat --no-spec
call nest g service core/lookup/category-lookup --flat --no-spec
call nest g service core/lookup/role-lookup --flat --no-spec
call nest g service core/lookup/service-type-lookup --flat --no-spec
call nest g service core/lookup/event-type-lookup --flat --no-spec

REM --- Domain Services ---
echo [INFO] Generating Domain services...

REM Catalog Services
call nest g service domain/catalog/vendor-profile --flat --no-spec
call nest g service domain/catalog/portfolio --flat --no-spec
call nest g service domain/catalog/service --flat --no-spec

REM Leads Services
call nest g service domain/leads/lead --flat --no-spec
call nest g service domain/leads/message --flat --no-spec

REM Planning Services
call nest g service domain/planning/event --flat --no-spec
call nest g service domain/planning/checklist --flat --no-spec
call nest g service domain/planning/checklist-item --flat --no-spec
call nest g service domain/planning/guestlist --flat --no-spec
call nest g service domain/planning/guest --flat --no-spec
call nest g service domain/planning/budget --flat --no-spec
call nest g service domain/planning/budget-item --flat --no-spec
call nest g service domain/planning/timeline --flat --no-spec
call nest g service domain/planning/event-vendor --flat --no-spec
call nest g service domain/planning/wishlist --flat --no-spec
call nest g service domain/planning/event-memory --flat --no-spec

REM Operations Services - Compliance
call nest g service domain/operations/kyc-verification --flat --no-spec
call nest g service domain/operations/dispute --flat --no-spec
call nest g service domain/operations/billing --flat --no-spec
REM Operations Services - Event Execution Workflow
call nest g service domain/operations/active-event --flat --no-spec
call nest g service domain/operations/lead-conversion --flat --no-spec
call nest g service domain/operations/event-note --flat --no-spec
call nest g service domain/operations/requirement-sheet --flat --no-spec
call nest g service domain/operations/vendor-agreement --flat --no-spec
call nest g service domain/operations/provisional-invoice --flat --no-spec
call nest g service domain/operations/operational-task --flat --no-spec
call nest g service domain/operations/task-attachment --flat --no-spec
call nest g service domain/operations/ops-dashboard --flat --no-spec

REM Content Services
call nest g service domain/content/blog --flat --no-spec

REM --- Infrastructure Services ---
echo [INFO] Generating Infrastructure services...
call nest g service infrastructure/storage/minio --flat --no-spec
call nest g service infrastructure/storage/upload --flat --no-spec
call nest g service infrastructure/storage/cdn --flat --no-spec
call nest g service infrastructure/search/meilisearch --flat --no-spec
call nest g service infrastructure/cache/dragonfly --flat --no-spec
call nest g service infrastructure/notifications/email --flat --no-spec
call nest g service infrastructure/resilience/circuit-breaker --flat --no-spec
call nest g service infrastructure/resilience/retry --flat --no-spec

echo [INFO] Services generated successfully.
echo.

REM ============================================================
REM STEP 7: Generate Guards & Strategies
REM ============================================================
echo ============================================================
echo STEP 7: Generating Guards and Strategies
echo ============================================================

call nest g guard core/auth/guards/jwt-auth --flat --no-spec
call nest g guard core/auth/guards/roles --flat --no-spec
call nest g guard core/auth/guards/tenant --flat --no-spec

echo [INFO] Guards generated successfully.
echo.

REM ============================================================
REM STEP 8: Generate Gateways (WebSocket)
REM ============================================================
echo ============================================================
echo STEP 8: Generating WebSocket Gateways
echo ============================================================

call nest g gateway infrastructure/websockets/notification --flat --no-spec
call nest g gateway infrastructure/websockets/messaging --flat --no-spec

echo [INFO] WebSocket gateways generated successfully.
echo.

REM ============================================================
REM STEP 9: Create Additional Directory Structure
REM ============================================================
echo ============================================================
echo STEP 9: Creating Additional Directory Structure
echo ============================================================

REM --- DTO Directories ---
mkdir "src\api\admin-gateway\dto" 2>nul
mkdir "src\api\ops-gateway\dto" 2>nul
mkdir "src\api\marketing-gateway\dto" 2>nul
mkdir "src\api\sales-gateway\dto" 2>nul
mkdir "src\api\business-gateway\dto" 2>nul
mkdir "src\api\user-gateway\dto" 2>nul
mkdir "src\api\public-gateway\dto" 2>nul

REM --- Core Directories ---
mkdir "src\core\auth\strategies" 2>nul
mkdir "src\core\auth\decorators" 2>nul
mkdir "src\core\database\repositories" 2>nul
mkdir "src\core\events\handlers" 2>nul
mkdir "src\core\common\decorators" 2>nul
mkdir "src\core\common\interceptors" 2>nul
mkdir "src\core\common\filters" 2>nul
mkdir "src\core\common\pipes" 2>nul
mkdir "src\core\common\utils" 2>nul

REM --- Domain Directories ---
mkdir "src\domain\catalog\dto" 2>nul
mkdir "src\domain\catalog\repositories" 2>nul
mkdir "src\domain\catalog\events" 2>nul

mkdir "src\domain\leads\dto" 2>nul
mkdir "src\domain\leads\repositories" 2>nul
mkdir "src\domain\leads\events" 2>nul

mkdir "src\domain\planning\dto" 2>nul
mkdir "src\domain\planning\repositories" 2>nul
mkdir "src\domain\planning\events" 2>nul

mkdir "src\domain\operations\dto" 2>nul
mkdir "src\domain\operations\repositories" 2>nul
mkdir "src\domain\operations\events" 2>nul

mkdir "src\domain\content\dto" 2>nul
mkdir "src\domain\content\repositories" 2>nul

REM --- Infrastructure Directories ---
mkdir "src\infrastructure\jobs\processors" 2>nul
mkdir "src\infrastructure\jobs\queues" 2>nul
mkdir "src\infrastructure\search\indexers" 2>nul
mkdir "src\infrastructure\cache\strategies" 2>nul
mkdir "src\infrastructure\notifications\templates" 2>nul
mkdir "src\infrastructure\websockets\dto" 2>nul

echo [INFO] Directory structure created successfully.
echo.

REM ============================================================
REM STEP 10: Create Placeholder Files
REM ============================================================
echo ============================================================
echo STEP 10: Creating Placeholder Files
echo ============================================================

REM --- Auth Strategies ---
echo // JWT Strategy > "src\core\auth\strategies\jwt.strategy.ts"
echo // API Key Strategy > "src\core\auth\strategies\api-key.strategy.ts"
echo // Refresh Token Strategy > "src\core\auth\strategies\refresh-token.strategy.ts"

REM --- Auth Decorators ---
echo // Current User Decorator > "src\core\auth\decorators\current-user.decorator.ts"
echo // Roles Decorator > "src\core\auth\decorators\roles.decorator.ts"
echo // Public Decorator > "src\core\auth\decorators\public.decorator.ts"

REM --- Common Decorators ---
echo // API Paginated Decorator > "src\core\common\decorators\api-paginated.decorator.ts"
echo // Cache Key Decorator > "src\core\common\decorators\cache-key.decorator.ts"
echo // Idempotent Decorator > "src\core\common\decorators\idempotent.decorator.ts"

REM --- Common Interceptors ---
echo // Logging Interceptor > "src\core\common\interceptors\logging.interceptor.ts"
echo // Cache Interceptor > "src\core\common\interceptors\cache.interceptor.ts"
echo // Transform Interceptor > "src\core\common\interceptors\transform.interceptor.ts"

REM --- Common Filters ---
echo // HTTP Exception Filter > "src\core\common\filters\http-exception.filter.ts"
echo // Prisma Exception Filter > "src\core\common\filters\prisma-exception.filter.ts"

REM --- Common Pipes ---
echo // Validation Pipe > "src\core\common\pipes\validation.pipe.ts"

REM --- Common Utils ---
echo // Pagination Utilities > "src\core\common\utils\pagination.ts"
echo // Crypto Utilities > "src\core\common\utils\crypto.ts"
echo // Batch Processor > "src\core\common\utils\batch-processor.ts"
echo // Slug Generator > "src\core\common\utils\slug-generator.ts"

REM --- Event Handlers ---
echo // Cache Invalidation Handler > "src\core\events\handlers\cache-invalidation.handler.ts"
echo // Search Index Handler > "src\core\events\handlers\search-index.handler.ts"
echo // Event Constants > "src\core\events\event-constants.ts"

REM --- Base Repository ---
echo // Base Repository > "src\core\database\repositories\base.repository.ts"
echo // Prisma Extension > "src\core\database\prisma.extension.ts"

REM --- Search Indexers ---
echo // Vendor Indexer > "src\infrastructure\search\indexers\vendor.indexer.ts"
echo // Event Indexer > "src\infrastructure\search\indexers\event.indexer.ts"

REM --- Cache Strategies ---
echo // Cache Aside Strategy > "src\infrastructure\cache\strategies\cache-aside.strategy.ts"
echo // Write Through Strategy > "src\infrastructure\cache\strategies\write-through.strategy.ts"
echo // Read Through Strategy > "src\infrastructure\cache\strategies\read-through.strategy.ts"

REM --- Job Processors ---
echo // Email Processor > "src\infrastructure\jobs\processors\email.processor.ts"
echo // Notification Processor > "src\infrastructure\jobs\processors\notification.processor.ts"
echo // Media Processing Processor > "src\infrastructure\jobs\processors\media-processing.processor.ts"
echo // Search Sync Processor > "src\infrastructure\jobs\processors\search-sync.processor.ts"

REM --- Job Queues ---
echo // Email Queue > "src\infrastructure\jobs\queues\email.queue.ts"
echo // Media Queue > "src\infrastructure\jobs\queues\media.queue.ts"

REM --- Resilience ---
echo // Timeout Interceptor > "src\infrastructure\resilience\timeout.interceptor.ts"

REM --- Operations Workflow DTOs ---
echo // Active Event DTO > "src\domain\operations\dto\active-event.dto.ts"
echo // Create Active Event DTO > "src\domain\operations\dto\create-active-event.dto.ts"
echo // Update Active Event DTO > "src\domain\operations\dto\update-active-event.dto.ts"
echo // Convert Lead to Event DTO > "src\domain\operations\dto\convert-lead-to-event.dto.ts"
echo // Event Note DTO > "src\domain\operations\dto\event-note.dto.ts"
echo // Requirement Sheet DTO > "src\domain\operations\dto\requirement-sheet.dto.ts"
echo // Requirement Item DTO > "src\domain\operations\dto\requirement-item.dto.ts"
echo // Vendor Agreement DTO > "src\domain\operations\dto\vendor-agreement.dto.ts"
echo // Create Vendor Agreement DTO > "src\domain\operations\dto\create-vendor-agreement.dto.ts"
echo // Provisional Invoice DTO > "src\domain\operations\dto\provisional-invoice.dto.ts"
echo // Operational Task DTO > "src\domain\operations\dto\operational-task.dto.ts"
echo // Create Operational Task DTO > "src\domain\operations\dto\create-operational-task.dto.ts"
echo // Update Task Status DTO > "src\domain\operations\dto\update-task-status.dto.ts"
echo // Task Attachment DTO > "src\domain\operations\dto\task-attachment.dto.ts"

REM --- Operations Workflow Repositories ---
echo // Active Event Repository > "src\domain\operations\repositories\active-event.repository.ts"
echo // Requirement Sheet Repository > "src\domain\operations\repositories\requirement-sheet.repository.ts"
echo // Vendor Agreement Repository > "src\domain\operations\repositories\vendor-agreement.repository.ts"
echo // Operational Task Repository > "src\domain\operations\repositories\operational-task.repository.ts"
echo // Provisional Invoice Repository > "src\domain\operations\repositories\provisional-invoice.repository.ts"

REM --- Operations Workflow Events ---
echo // Active Event Events > "src\domain\operations\events\active-event.events.ts"
echo // Active Event Listener > "src\domain\operations\events\active-event.listener.ts"
echo // Vendor Agreement Events > "src\domain\operations\events\vendor-agreement.events.ts"
echo // Vendor Agreement Listener > "src\domain\operations\events\vendor-agreement.listener.ts"
echo // Operational Task Events > "src\domain\operations\events\operational-task.events.ts"
echo // Operational Task Listener > "src\domain\operations\events\operational-task.listener.ts"

REM --- Planning DTOs ---
echo // Event DTO > "src\domain\planning\dto\event.dto.ts"
echo // Create Event DTO > "src\domain\planning\dto\create-event.dto.ts"
echo // Update Event DTO > "src\domain\planning\dto\update-event.dto.ts"
echo // Checklist DTO > "src\domain\planning\dto\checklist.dto.ts"
echo // Create Checklist DTO > "src\domain\planning\dto\create-checklist.dto.ts"
echo // Checklist Item DTO > "src\domain\planning\dto\checklist-item.dto.ts"
echo // Create Checklist Item DTO > "src\domain\planning\dto\create-checklist-item.dto.ts"
echo // Update Checklist Item DTO > "src\domain\planning\dto\update-checklist-item.dto.ts"
echo // Guestlist DTO > "src\domain\planning\dto\guestlist.dto.ts"
echo // Guest DTO > "src\domain\planning\dto\guest.dto.ts"
echo // Create Guest DTO > "src\domain\planning\dto\create-guest.dto.ts"
echo // Update Guest DTO > "src\domain\planning\dto\update-guest.dto.ts"
echo // Update RSVP DTO > "src\domain\planning\dto\update-rsvp.dto.ts"
echo // Bulk Import Guests DTO > "src\domain\planning\dto\bulk-import-guests.dto.ts"
echo // Budget DTO > "src\domain\planning\dto\budget.dto.ts"
echo // Budget Item DTO > "src\domain\planning\dto\budget-item.dto.ts"
echo // Create Budget Item DTO > "src\domain\planning\dto\create-budget-item.dto.ts"
echo // Update Budget Item DTO > "src\domain\planning\dto\update-budget-item.dto.ts"
echo // Timeline DTO > "src\domain\planning\dto\timeline.dto.ts"
echo // Create Timeline DTO > "src\domain\planning\dto\create-timeline.dto.ts"
echo // Timeline Item DTO > "src\domain\planning\dto\timeline-item.dto.ts"
echo // Event Vendor DTO > "src\domain\planning\dto\event-vendor.dto.ts"
echo // Add Event Vendor DTO > "src\domain\planning\dto\add-event-vendor.dto.ts"
echo // Update Event Vendor DTO > "src\domain\planning\dto\update-event-vendor.dto.ts"
echo // Wishlist DTO > "src\domain\planning\dto\wishlist.dto.ts"
echo // Create Wishlist DTO > "src\domain\planning\dto\create-wishlist.dto.ts"
echo // Event Memory DTO > "src\domain\planning\dto\event-memory.dto.ts"
echo // Guest Upload DTO > "src\domain\planning\dto\guest-upload.dto.ts"

REM --- Planning Repositories ---
echo // Event Repository > "src\domain\planning\repositories\event.repository.ts"
echo // Checklist Repository > "src\domain\planning\repositories\checklist.repository.ts"
echo // Guestlist Repository > "src\domain\planning\repositories\guestlist.repository.ts"
echo // Budget Repository > "src\domain\planning\repositories\budget.repository.ts"
echo // Timeline Repository > "src\domain\planning\repositories\timeline.repository.ts"
echo // Event Vendor Repository > "src\domain\planning\repositories\event-vendor.repository.ts"
echo // Wishlist Repository > "src\domain\planning\repositories\wishlist.repository.ts"

REM --- Planning Events ---
echo // Event Events > "src\domain\planning\events\event.events.ts"
echo // Event Listener > "src\domain\planning\events\event.listener.ts"
echo // Checklist Events > "src\domain\planning\events\checklist.events.ts"
echo // Guestlist Events > "src\domain\planning\events\guestlist.events.ts"
echo // Budget Events > "src\domain\planning\events\budget.events.ts"

echo [INFO] Placeholder files created successfully.
echo.

REM ============================================================
REM STEP 11: Create Environment Files
REM ============================================================
echo ============================================================
echo STEP 11: Creating Environment Files
echo ============================================================

(
echo # Database
echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omnicassion?schema=public"
echo.
echo # JWT
echo JWT_SECRET="your-super-secret-jwt-key-change-in-production"
echo JWT_EXPIRES_IN="15m"
echo JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
echo JWT_REFRESH_EXPIRES_IN="7d"
echo.
echo # Redis/Dragonfly
echo REDIS_HOST="localhost"
echo REDIS_PORT=6379
echo.
echo # Meilisearch
echo MEILISEARCH_HOST="http://localhost:7700"
echo MEILISEARCH_API_KEY="your-meilisearch-api-key"
echo.
echo # MinIO
echo MINIO_ENDPOINT="localhost"
echo MINIO_PORT=9000
echo MINIO_ACCESS_KEY="minioadmin"
echo MINIO_SECRET_KEY="minioadmin"
echo MINIO_BUCKET="omnicassion"
echo.
echo # App
echo PORT=3000
echo NODE_ENV="development"
) > ".env.example"

copy ".env.example" ".env" >nul

echo [INFO] Environment files created.
echo.

REM ============================================================
REM STEP 12: Create Docker Compose File
REM ============================================================
echo ============================================================
echo STEP 12: Creating Docker Compose File
echo ============================================================

(
echo version: '3.8'
echo.
echo services:
echo   postgres:
echo     image: postgres:16-alpine
echo     container_name: omnicassion-postgres
echo     environment:
echo       POSTGRES_USER: postgres
echo       POSTGRES_PASSWORD: postgres
echo       POSTGRES_DB: omnicassion
echo     ports:
echo       - "5432:5432"
echo     volumes:
echo       - postgres_data:/var/lib/postgresql/data
echo     healthcheck:
echo       test: ["CMD-SHELL", "pg_isready -U postgres"]
echo       interval: 5s
echo       timeout: 5s
echo       retries: 5
echo.
echo   dragonfly:
echo     image: docker.dragonflydb.io/dragonflydb/dragonfly
echo     container_name: omnicassion-dragonfly
echo     ports:
echo       - "6379:6379"
echo     volumes:
echo       - dragonfly_data:/data
echo.
echo   meilisearch:
echo     image: getmeili/meilisearch:latest
echo     container_name: omnicassion-meilisearch
echo     environment:
echo       MEILI_ENV: development
echo       MEILI_MASTER_KEY: your-meilisearch-api-key
echo     ports:
echo       - "7700:7700"
echo     volumes:
echo       - meilisearch_data:/meili_data
echo.
echo   minio:
echo     image: minio/minio:latest
echo     container_name: omnicassion-minio
echo     command: server /data --console-address ":9001"
echo     environment:
echo       MINIO_ROOT_USER: minioadmin
echo       MINIO_ROOT_PASSWORD: minioadmin
echo     ports:
echo       - "9000:9000"
echo       - "9001:9001"
echo     volumes:
echo       - minio_data:/data
echo.
echo volumes:
echo   postgres_data:
echo   dragonfly_data:
echo   meilisearch_data:
echo   minio_data:
) > "docker-compose.yml"

echo [INFO] Docker Compose file created.
echo.

REM ============================================================
REM STEP 13: Update package.json Scripts
REM ============================================================
echo ============================================================
echo STEP 13: Setup Complete!
echo ============================================================
echo.
echo [SUCCESS] Omnicassion V2.0 Backend has been scaffolded!
echo.
echo Next Steps:
echo -----------
echo 1. cd backend
echo 2. Start Docker containers: docker-compose up -d
echo 3. Copy the Prisma schema from DEVELOPMENT_PLAN.md to prisma/schema.prisma
echo 4. Run migrations: npx prisma migrate dev --name init
echo 5. Generate Prisma client: npx prisma generate
echo 6. Start the development server: npm run start:dev
echo.
echo Project Structure:
echo ------------------
echo   src/
echo   ├── api/              ^(7 Gateway modules with 40+ controllers^)
echo   │   ├── ops-gateway/  ^(Event Workflow: active-events, requirements,^)
echo   │   │                 ^(vendor-agreements, tasks, invoices, dashboard^)
echo   │   └── business-gateway/ ^(Vendor: agreements, tasks, calendar^)
echo   ├── core/             ^(Auth, Database, Events, Lookup, Common^)
echo   ├── domain/
echo   │   └── operations/   ^(Event Execution Workflow Services^)
echo   │       ├── active-event, lead-conversion, event-note
echo   │       ├── requirement-sheet, vendor-agreement
echo   │       ├── operational-task, task-attachment
echo   │       └── ops-dashboard, provisional-invoice
echo   └── infrastructure/   ^(Storage, Jobs, Search, Cache, WebSockets^)
echo.
echo Operational Workflow Features:
echo ------------------------------
echo   - Dual-Origin Events ^(Digital Lead + Direct Booking^)
echo   - Requirement Sheet Builder
echo   - Vendor Agreement System with Contract Locking
echo   - Task Delegation to Ops Assistants/Vendors
echo   - Proof Upload ^& Manager Approval
echo   - Ops Dashboard ^(Calendar, Financials, Analytics^)
echo.
echo Documentation: See DEVELOPMENT_PLAN.md for detailed architecture
echo.

cd /d "%~dp0"
pause
