-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRADOR', 'ADMINISTRATIVO', 'LECTURA');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('PENDIENTE', 'REALIZADA', 'PARCIAL', 'INCIDENCIA', 'PENDIENTE_CALIDAD', 'FALTA_STOCK', 'ANULADA');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('CARGA_OF', 'TRASIEGO', 'MOVIMIENTO_STOCK', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'STATUS_CHANGE', 'VOID', 'DELETE', 'LOGIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surnames" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'LECTURA',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carga" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipoMovimiento" "MovementType" NOT NULL DEFAULT 'CARGA_OF',
    "nbiEntrega" TEXT,
    "nbiRecepcion" TEXT,
    "codigoArticulo" TEXT NOT NULL,
    "descripcionArticulo" TEXT NOT NULL,
    "lote" TEXT,
    "cantidadPrevista" DECIMAL(12,3) NOT NULL,
    "cantidadRealizada" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "ubicacionOrigen" TEXT,
    "ubicacionDestino" TEXT,
    "ordenFabricacion" TEXT,
    "comentario" TEXT,
    "estado" "LoadStatus" NOT NULL DEFAULT 'PENDIENTE',
    "voidReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "deletedById" TEXT,
    "voidedById" TEXT,

    CONSTRAINT "Carga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "appName" TEXT NOT NULL DEFAULT 'Almacén General',
    "warehouseName" TEXT NOT NULL DEFAULT 'Fábrica de Municiones de Granada',
    "itemsPerPage" INTEGER NOT NULL DEFAULT 25,
    "confirmBeforeVoid" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Carga_codigoArticulo_idx" ON "Carga"("codigoArticulo");

-- CreateIndex
CREATE INDEX "Carga_ordenFabricacion_idx" ON "Carga"("ordenFabricacion");

-- CreateIndex
CREATE INDEX "Carga_lote_idx" ON "Carga"("lote");

-- CreateIndex
CREATE INDEX "Carga_estado_idx" ON "Carga"("estado");

-- CreateIndex
CREATE INDEX "Carga_fecha_idx" ON "Carga"("fecha");

-- CreateIndex
CREATE INDEX "Carga_createdAt_idx" ON "Carga"("createdAt");

-- CreateIndex
CREATE INDEX "Carga_deletedAt_idx" ON "Carga"("deletedAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "Carga" ADD CONSTRAINT "Carga_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carga" ADD CONSTRAINT "Carga_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carga" ADD CONSTRAINT "Carga_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carga" ADD CONSTRAINT "Carga_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

