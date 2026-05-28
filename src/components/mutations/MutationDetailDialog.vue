<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import MutationTypeTag from '@/components/mutations/MutationTypeTag.vue'
import type { StockMutation } from '@/types/stockMutation'
import type { Warehouse } from '@/types/warehouse'

type Props = {
  visible: boolean
  mutation: StockMutation | null
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

function formatQty(value: string | number) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(Number(value))
}

function formatNullable(value: string | null | undefined) {
  return value?.trim() || '-'
}

function getProductTitle(mutation: StockMutation) {
  return mutation.product?.name ?? `Produk #${mutation.product_id}`
}

function getProductCode(mutation: StockMutation) {
  return mutation.product?.sku ?? '-'
}

function getUnitName(mutation: StockMutation) {
  return mutation.product?.unit?.name ?? ''
}

function getWarehouseName(value?: Warehouse | null, id?: number | null) {
  if (value) {
    return `${value.code} - ${value.name}`
  }

  return id ? `Gudang #${id}` : '-'
}

function getWarehouseCode(value?: Warehouse | null) {
  return value?.code ?? '-'
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Detail Mutasi"
    class="w-[calc(100vw-2rem)] max-w-4xl"
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

    <div v-else-if="mutation" class="space-y-4">
      <div class="app-preview-panel">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-teal-700">
              Produk
            </p>
            <h3 class="mt-2 text-lg font-extrabold text-slate-950">
              {{ getProductTitle(mutation) }}
            </h3>
            <p class="mt-1 font-mono text-sm font-semibold text-slate-500">
              {{ getProductCode(mutation) }}
            </p>
          </div>
          <MutationTypeTag :type="mutation.type" />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="mutation-detail-card">
          <p class="mutation-detail-label">Qty</p>
          <p class="mutation-detail-value">
            {{ formatQty(mutation.qty) }}
            <span v-if="getUnitName(mutation)" class="text-base text-slate-500">
              {{ getUnitName(mutation) }}
            </span>
          </p>
        </div>
        <div class="mutation-detail-card">
          <p class="mutation-detail-label">Tanggal</p>
          <p class="mutation-detail-value mutation-detail-value--small">
            {{ formatDate(mutation.created_at) }}
          </p>
        </div>
        <div class="mutation-detail-card">
          <p class="mutation-detail-label">Gudang Asal</p>
          <p class="mutation-detail-value mutation-detail-value--small">
            {{ getWarehouseName(mutation.from_warehouse, mutation.from_warehouse_id) }}
          </p>
          <p class="mutation-detail-muted">{{ getWarehouseCode(mutation.from_warehouse) }}</p>
        </div>
        <div class="mutation-detail-card">
          <p class="mutation-detail-label">Gudang Tujuan</p>
          <p class="mutation-detail-value mutation-detail-value--small">
            {{ getWarehouseName(mutation.to_warehouse, mutation.to_warehouse_id) }}
          </p>
          <p class="mutation-detail-muted">{{ getWarehouseCode(mutation.to_warehouse) }}</p>
        </div>
        <div class="mutation-detail-card">
          <p class="mutation-detail-label">Reference No</p>
          <p class="mutation-detail-value mutation-detail-value--small">
            {{ formatNullable(mutation.reference_no) }}
          </p>
        </div>
        <div class="mutation-detail-card">
          <p class="mutation-detail-label">Catatan</p>
          <p class="mutation-detail-value mutation-detail-value--small">
            {{ formatNullable(mutation.notes) }}
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
.mutation-detail-card {
  border: 1px solid var(--sf-border);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.78);
  padding: 1rem;
}

.mutation-detail-label {
  color: var(--sf-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.mutation-detail-value {
  margin-top: 0.45rem;
  color: var(--sf-text);
  font-size: 1.35rem;
  font-weight: 800;
}

.mutation-detail-value--small {
  font-size: 0.98rem;
}

.mutation-detail-muted {
  margin-top: 0.35rem;
  color: var(--sf-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 0.82rem;
  font-weight: 700;
}
</style>
