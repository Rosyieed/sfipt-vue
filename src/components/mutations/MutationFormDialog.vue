<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import type { ApiValidationErrors } from '@/types/auth'
import type { Product } from '@/types/product'
import type { StockMutationPayload, StockMutationType } from '@/types/stockMutation'
import type { Warehouse } from '@/types/warehouse'

type AdjustmentDirection = 'increase' | 'decrease'

type Props = {
  visible: boolean
  products: Product[]
  warehouses: Warehouse[]
  submitting: boolean
  errors: ApiValidationErrors
  message: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [payload: StockMutationPayload]
}>()

const form = reactive<{
  product_id: number | null
  type: StockMutationType
  from_warehouse_id: number | null
  to_warehouse_id: number | null
  adjustment_direction: AdjustmentDirection
  adjustment_warehouse_id: number | null
  qty: number
  reference_no: string | null
  notes: string | null
}>({
  product_id: null,
  type: 'in',
  from_warehouse_id: null,
  to_warehouse_id: null,
  adjustment_direction: 'increase',
  adjustment_warehouse_id: null,
  qty: 1,
  reference_no: null,
  notes: null,
})

const productOptions = computed(() =>
  props.products.map((product) => ({
    label: `${product.sku} - ${product.name}`,
    value: product.id,
  })),
)

const warehouseOptions = computed(() =>
  props.warehouses.map((warehouse) => ({
    label: `${warehouse.code} - ${warehouse.name}`,
    value: warehouse.id,
  })),
)

const typeOptions: Array<{ label: string; value: StockMutationType }> = [
  { label: 'Stok Masuk', value: 'in' },
  { label: 'Stok Keluar', value: 'out' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'Adjustment', value: 'adjustment' },
]

const adjustmentDirectionOptions: Array<{ label: string; value: AdjustmentDirection }> = [
  { label: 'Tambah stok', value: 'increase' },
  { label: 'Kurangi stok', value: 'decrease' },
]

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return
    }

    form.product_id = null
    form.type = 'in'
    form.from_warehouse_id = null
    form.to_warehouse_id = null
    form.adjustment_direction = 'increase'
    form.adjustment_warehouse_id = null
    form.qty = 1
    form.reference_no = null
    form.notes = null
  },
  { immediate: true },
)

watch(
  () => form.type,
  () => {
    form.from_warehouse_id = null
    form.to_warehouse_id = null
    form.adjustment_warehouse_id = null
    form.adjustment_direction = 'increase'
  },
)

function closeDialog() {
  emit('update:visible', false)
}

function submitForm() {
  const payload: StockMutationPayload = {
    product_id: form.product_id,
    type: form.type,
    qty: Number(form.qty ?? 0),
    reference_no: form.reference_no?.trim() ? form.reference_no.trim() : null,
    notes: form.notes?.trim() ? form.notes.trim() : null,
  }

  if (form.type === 'in') {
    payload.to_warehouse_id = form.to_warehouse_id
  }

  if (form.type === 'out') {
    payload.from_warehouse_id = form.from_warehouse_id
  }

  if (form.type === 'transfer') {
    payload.from_warehouse_id = form.from_warehouse_id
    payload.to_warehouse_id = form.to_warehouse_id
  }

  if (form.type === 'adjustment') {
    if (form.adjustment_direction === 'increase') {
      payload.to_warehouse_id = form.adjustment_warehouse_id
    } else {
      payload.from_warehouse_id = form.adjustment_warehouse_id
    }
  }

  emit('submit', payload)
}

function getFieldError(field: keyof StockMutationPayload | 'adjustment_warehouse_id') {
  return props.errors[field]?.[0] ?? ''
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Tambah Mutasi Stok"
    class="w-[calc(100vw-2rem)] max-w-4xl"
    @update:visible="emit('update:visible', $event)"
  >
    <Message v-if="message" class="mb-4" severity="error" :closable="false">
      {{ message }}
    </Message>

    <form class="space-y-5" novalidate @submit.prevent="submitForm">
      <div class="grid gap-5 md:grid-cols-2">
        <div class="space-y-2">
          <label for="mutation-product" class="block text-sm font-medium text-slate-700">Produk</label>
          <Select
            id="mutation-product"
            v-model="form.product_id"
            class="w-full"
            :options="productOptions"
            option-label="label"
            option-value="value"
            filter
            placeholder="Pilih produk"
            :invalid="Boolean(getFieldError('product_id'))"
          />
          <p v-if="getFieldError('product_id')" class="text-sm text-red-600">
            {{ getFieldError('product_id') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="mutation-type" class="block text-sm font-medium text-slate-700">Tipe</label>
          <Select
            id="mutation-type"
            v-model="form.type"
            class="w-full"
            :options="typeOptions"
            option-label="label"
            option-value="value"
            :invalid="Boolean(getFieldError('type'))"
          />
          <p v-if="getFieldError('type')" class="text-sm text-red-600">
            {{ getFieldError('type') }}
          </p>
        </div>

        <div v-if="form.type === 'out' || form.type === 'transfer'" class="space-y-2">
          <label for="mutation-from-warehouse" class="block text-sm font-medium text-slate-700">
            Gudang Asal
          </label>
          <Select
            id="mutation-from-warehouse"
            v-model="form.from_warehouse_id"
            class="w-full"
            :options="warehouseOptions"
            option-label="label"
            option-value="value"
            filter
            placeholder="Pilih gudang asal"
            :invalid="Boolean(getFieldError('from_warehouse_id'))"
          />
          <p v-if="getFieldError('from_warehouse_id')" class="text-sm text-red-600">
            {{ getFieldError('from_warehouse_id') }}
          </p>
        </div>

        <div v-if="form.type === 'in' || form.type === 'transfer'" class="space-y-2">
          <label for="mutation-to-warehouse" class="block text-sm font-medium text-slate-700">
            Gudang Tujuan
          </label>
          <Select
            id="mutation-to-warehouse"
            v-model="form.to_warehouse_id"
            class="w-full"
            :options="warehouseOptions"
            option-label="label"
            option-value="value"
            filter
            placeholder="Pilih gudang tujuan"
            :invalid="Boolean(getFieldError('to_warehouse_id'))"
          />
          <p v-if="getFieldError('to_warehouse_id')" class="text-sm text-red-600">
            {{ getFieldError('to_warehouse_id') }}
          </p>
        </div>

        <div v-if="form.type === 'adjustment'" class="space-y-2">
          <label for="mutation-adjustment-direction" class="block text-sm font-medium text-slate-700">
            Arah Adjustment
          </label>
          <Select
            id="mutation-adjustment-direction"
            v-model="form.adjustment_direction"
            class="w-full"
            :options="adjustmentDirectionOptions"
            option-label="label"
            option-value="value"
          />
        </div>

        <div v-if="form.type === 'adjustment'" class="space-y-2">
          <label for="mutation-adjustment-warehouse" class="block text-sm font-medium text-slate-700">
            Gudang
          </label>
          <Select
            id="mutation-adjustment-warehouse"
            v-model="form.adjustment_warehouse_id"
            class="w-full"
            :options="warehouseOptions"
            option-label="label"
            option-value="value"
            filter
            placeholder="Pilih gudang"
            :invalid="Boolean(getFieldError('adjustment_warehouse_id'))"
          />
          <p v-if="getFieldError('adjustment_warehouse_id')" class="text-sm text-red-600">
            {{ getFieldError('adjustment_warehouse_id') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="mutation-qty" class="block text-sm font-medium text-slate-700">Qty</label>
          <InputNumber
            v-model="form.qty"
            input-id="mutation-qty"
            class="w-full"
            input-class="w-full"
            :min="0"
            :min-fraction-digits="0"
            :max-fraction-digits="4"
            :invalid="Boolean(getFieldError('qty'))"
          />
          <p v-if="getFieldError('qty')" class="text-sm text-red-600">
            {{ getFieldError('qty') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="mutation-reference" class="block text-sm font-medium text-slate-700">
            Reference No
          </label>
          <InputText
            id="mutation-reference"
            v-model="form.reference_no"
            class="w-full"
            :invalid="Boolean(getFieldError('reference_no'))"
            autocomplete="off"
          />
          <p v-if="getFieldError('reference_no')" class="text-sm text-red-600">
            {{ getFieldError('reference_no') }}
          </p>
        </div>
      </div>

      <div class="space-y-2">
        <label for="mutation-notes" class="block text-sm font-medium text-slate-700">Catatan</label>
        <Textarea
          id="mutation-notes"
          v-model="form.notes"
          class="w-full"
          rows="3"
          :invalid="Boolean(getFieldError('notes'))"
          auto-resize
        />
        <p v-if="getFieldError('notes')" class="text-sm text-red-600">
          {{ getFieldError('notes') }}
        </p>
      </div>

      <div class="flex flex-col-reverse gap-3 border-t border-teal-900/10 pt-5 sm:flex-row sm:justify-end">
        <Button label="Batal" severity="secondary" outlined type="button" @click="closeDialog" />
        <Button type="submit" label="Simpan Mutasi" :loading="submitting" :disabled="submitting" />
      </div>
    </form>
  </Dialog>
</template>
