<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import type { Stock } from '@/types/stock'

type Props = {
  visible: boolean
  stock: Stock | null
  loading: boolean
  message: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

function closeDialog() {
  emit('update:visible', false)
}

function formatDate(value?: string) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatQty(value: string | number | undefined) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0))
}

function getProductName(stock: Stock) {
  return stock.product?.name ?? `Produk #${stock.product_id}`
}

function getProductCode(stock: Stock) {
  return stock.product?.sku ?? '-'
}

function getProductBarcode(stock: Stock) {
  return stock.product?.barcode ?? '-'
}

function getUnitName(stock: Stock) {
  return stock.product?.unit?.name ?? ''
}

function getWarehouseName(stock: Stock) {
  return stock.warehouse?.name ?? `Gudang #${stock.warehouse_id}`
}

function getWarehouseCode(stock: Stock) {
  return stock.warehouse?.code ?? '-'
}

function isLowStock(stock: Stock) {
  if (typeof stock.is_low_stock === 'boolean') {
    return stock.is_low_stock
  }

  return Number(stock.qty) < Number(stock.product?.min_stock ?? 0)
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Detail Stok"
    class="w-[calc(100vw-2rem)] max-w-3xl"
    @update:visible="emit('update:visible', $event)"
  >
    <Message v-if="message" class="mb-4" severity="error" :closable="false">
      {{ message }}
    </Message>

    <div v-if="loading" class="grid gap-4 md:grid-cols-2">
      <Skeleton height="6rem" />
      <Skeleton height="6rem" />
      <Skeleton height="5rem" />
      <Skeleton height="5rem" />
    </div>

    <div v-else-if="stock" class="space-y-4">
      <div class="app-preview-panel">
        <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-teal-700">Produk</p>
        <h3 class="mt-2 text-lg font-extrabold text-slate-950">
          {{ getProductName(stock) }}
        </h3>
        <p class="mt-1 text-sm font-semibold text-slate-500">
          <span class="font-mono">{{ getProductCode(stock) }}</span>
          <span class="mx-1">-</span>
          <span>{{ getProductBarcode(stock) }}</span>
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="stock-detail-card">
          <p class="stock-detail-label">Gudang</p>
          <p class="stock-detail-value">{{ getWarehouseName(stock) }}</p>
          <p class="stock-detail-muted">{{ getWarehouseCode(stock) }}</p>
        </div>
        <div class="stock-detail-card">
          <p class="stock-detail-label">Status</p>
          <Tag
            class="mt-2"
            :value="isLowStock(stock) ? 'Stok rendah' : 'Aman'"
            :severity="isLowStock(stock) ? 'danger' : 'success'"
          />
        </div>
        <div class="stock-detail-card">
          <p class="stock-detail-label">Stok Saat Ini</p>
          <p
            class="stock-detail-value"
            :class="isLowStock(stock) ? 'text-red-700' : 'text-slate-950'"
          >
            {{ formatQty(stock.qty) }}
            <span v-if="getUnitName(stock)" class="text-base text-slate-500">
              {{ getUnitName(stock) }}
            </span>
          </p>
        </div>
        <div class="stock-detail-card">
          <p class="stock-detail-label">Minimum Stok</p>
          <p class="stock-detail-value">
            {{ formatQty(stock.product?.min_stock) }}
            <span v-if="getUnitName(stock)" class="text-base text-slate-500">
              {{ getUnitName(stock) }}
            </span>
          </p>
        </div>
        <div class="stock-detail-card">
          <p class="stock-detail-label">Dibuat</p>
          <p class="stock-detail-value stock-detail-value--small">
            {{ formatDate(stock.created_at) }}
          </p>
        </div>
        <div class="stock-detail-card">
          <p class="stock-detail-label">Update Terakhir</p>
          <p class="stock-detail-value stock-detail-value--small">
            {{ formatDate(stock.updated_at ?? stock.created_at) }}
          </p>
        </div>
      </div>
    </div>

    <div class="mt-5 flex justify-end border-t border-teal-900/10 pt-5">
      <Button label="Tutup" severity="secondary" outlined @click="closeDialog" />
    </div>
  </Dialog>
</template>

<style scoped>
.stock-detail-card {
  border: 1px solid var(--sf-border);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.78);
  padding: 1rem;
}

.stock-detail-label {
  color: var(--sf-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.stock-detail-value {
  margin-top: 0.45rem;
  color: var(--sf-text);
  font-size: 1.35rem;
  font-weight: 800;
}

.stock-detail-value--small {
  font-size: 0.98rem;
}

.stock-detail-muted {
  margin-top: 0.35rem;
  color: var(--sf-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 0.82rem;
  font-weight: 700;
}
</style>
