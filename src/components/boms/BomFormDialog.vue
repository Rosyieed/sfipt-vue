<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import type { ApiValidationErrors } from '@/types/auth'
import type { Product } from '@/types/product'
import type { Unit } from '@/types/unit'
import type { Bom, BomPayload } from '@/types/bom'

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  bom: Bom | null
  products: Product[]
  units: Unit[]
  submitting: boolean
  errors: ApiValidationErrors
  message: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [payload: BomPayload]
}>()

const form = reactive<BomPayload>({
  product_id: null,
  code: '',
  name: '',
  description: null,
  output_qty: 1,
  is_default: false,
  is_active: true,
  items: [],
})

const title = computed(() => (props.mode === 'edit' ? 'Edit BOM' : 'Tambah BOM'))
const submitLabel = computed(() => (props.mode === 'edit' ? 'Simpan Perubahan' : 'Simpan BOM'))

// Filter products for parent product (usually finished goods or semi-finished goods)
const parentProductOptions = computed(() => {
  return props.products
    .filter((p) => p.is_active && (p.type === 'finished_good' || p.type === 'semi_finished'))
    .map((p) => ({
      label: `${p.sku} - ${p.name}`,
      value: p.id,
    }))
})

// Filter products for BOM materials (usually raw material, semi finished, or packaging)
const materialOptions = computed(() => {
  return props.products
    .filter((p) => p.is_active && p.type !== 'finished_good')
    .map((p) => ({
      label: `${p.sku} - ${p.name}`,
      value: p.id,
    }))
})

function getMaterialUnitName(materialId: number | null) {
  if (!materialId) return '-'
  const matched = props.products.find((p) => Number(p.id) === Number(materialId))
  if (!matched) return '-'
  if (matched.unit) {
    return matched.unit.name || matched.unit.code
  }
  const unit = props.units.find((u) => Number(u.id) === Number(matched.unit_id))
  return unit?.name || unit?.code || `ID: ${matched.unit_id}`
}

watch(
  () => [props.visible, props.bom, props.mode] as const,
  () => {
    if (!props.visible) {
      return
    }

    if (props.mode === 'edit' && props.bom) {
      form.product_id = props.bom.product_id
      form.code = props.bom.code
      form.name = props.bom.name
      form.description = props.bom.description ?? null
      form.output_qty = Number(props.bom.output_qty)
      form.is_default = props.bom.is_default
      form.is_active = props.bom.is_active
      form.items = (props.bom.items ?? []).map((item) => ({
        material_id: item.material_id,
        qty_needed: Number(item.qty_needed),
        unit_id: item.unit_id,
        notes: item.notes ?? null,
      }))
    } else {
      form.product_id = null
      form.code = ''
      form.name = ''
      form.description = null
      form.output_qty = 1
      form.is_default = false
      form.is_active = true
      form.items = []
    }
  },
  { immediate: true },
)

function closeDialog() {
  emit('update:visible', false)
}

function addItem() {
  form.items.push({
    material_id: null,
    qty_needed: 1,
    unit_id: null,
    notes: null,
  })
}

function removeItem(index: number) {
  form.items.splice(index, 1)
}

function handleMaterialChange(index: number, materialId: number | null) {
  if (!materialId) return
  const matched = props.products.find((p) => Number(p.id) === Number(materialId))
  const item = form.items[index]
  if (item && matched && matched.unit_id) {
    item.unit_id = matched.unit_id
  }
}

function submitForm() {
  emit('submit', {
    ...form,
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description?.trim() ? form.description : null,
    items: form.items.map((item) => ({
      ...item,
      notes: item.notes?.trim() ? item.notes : null,
    })),
  })
}

function getFieldError(field: string) {
  return props.errors[field]?.[0] ?? ''
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="title"
    class="w-[calc(100vw-2rem)] max-w-5xl"
    @update:visible="emit('update:visible', $event)"
  >
    <Message v-if="message" class="mb-4" severity="error" :closable="false">
      {{ message }}
    </Message>

    <form class="space-y-6" novalidate @submit.prevent="submitForm">
      <!-- Section 1: Detail Resep (BOM Metadata) -->
      <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
        <h3 class="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
          Informasi BOM
        </h3>

        <div class="grid gap-5 md:grid-cols-2">
          <div class="space-y-2">
            <label for="bom-product" class="block text-sm font-medium text-slate-700">
              Produk Induk (Output)
            </label>
            <Select
              id="bom-product"
              v-model="form.product_id"
              :options="parentProductOptions"
              option-label="label"
              option-value="value"
              placeholder="Pilih produk hasil produksi"
              class="w-full"
              filter
              :invalid="Boolean(getFieldError('product_id'))"
              :disabled="mode === 'edit'"
            />
            <p v-if="getFieldError('product_id')" class="text-sm text-red-600">
              {{ getFieldError('product_id') }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="bom-output-qty" class="block text-sm font-medium text-slate-700">
              Kuantitas Hasil (Output Qty)
            </label>
            <InputNumber
              id="bom-output-qty"
              v-model="form.output_qty"
              class="w-full"
              input-class="w-full"
              :min="0.0001"
              :max-fraction-digits="4"
              mode="decimal"
              :invalid="Boolean(getFieldError('output_qty'))"
            />
            <p v-if="getFieldError('output_qty')" class="text-sm text-red-600">
              {{ getFieldError('output_qty') }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="bom-code" class="block text-sm font-medium text-slate-700">Kode BOM</label>
            <InputText
              id="bom-code"
              v-model="form.code"
              class="w-full"
              :invalid="Boolean(getFieldError('code'))"
              autocomplete="off"
            />
            <p v-if="getFieldError('code')" class="text-sm text-red-600">
              {{ getFieldError('code') }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="bom-name" class="block text-sm font-medium text-slate-700"
              >Nama Resep</label
            >
            <InputText
              id="bom-name"
              v-model="form.name"
              class="w-full"
              :invalid="Boolean(getFieldError('name'))"
              autocomplete="off"
            />
            <p v-if="getFieldError('name')" class="text-sm text-red-600">
              {{ getFieldError('name') }}
            </p>
          </div>

          <div class="space-y-2 md:col-span-2">
            <label for="bom-description" class="block text-sm font-medium text-slate-700">
              Deskripsi
            </label>
            <Textarea
              id="bom-description"
              v-model="form.description"
              class="w-full"
              rows="2"
              auto-resize
            />
          </div>

          <div class="flex flex-wrap gap-8 py-2 md:col-span-2">
            <div class="flex items-center gap-3">
              <ToggleSwitch id="bom-is-default" v-model="form.is_default" />
              <label
                for="bom-is-default"
                class="text-sm font-semibold text-slate-700 cursor-pointer"
              >
                Atur Sebagai Default (Resep Utama)
              </label>
            </div>

            <div class="flex items-center gap-3">
              <ToggleSwitch id="bom-is-active" v-model="form.is_active" />
              <label
                for="bom-is-active"
                class="text-sm font-semibold text-slate-700 cursor-pointer"
              >
                Aktif
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Bahan Baku & Komponen (Dynamic Items) -->
      <div class="rounded-xl border border-slate-100 p-4">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-500">
            Bahan Baku & Komponen
          </h3>
          <Button
            type="button"
            icon="pi pi-plus"
            label="Tambah Bahan"
            size="small"
            severity="success"
            outlined
            @click="addItem"
          />
        </div>

        <p v-if="getFieldError('items')" class="mb-4 text-sm text-red-600">
          {{ getFieldError('items') }}
        </p>

        <!-- Dynamic List of Materials -->
        <div
          v-if="form.items.length === 0"
          class="flex flex-col items-center justify-center py-8 text-center"
        >
          <i class="pi pi-receipt text-3xl text-slate-300"></i>
          <p class="mt-2 text-sm text-slate-500">Belum ada bahan baku yang ditambahkan.</p>
          <Button
            type="button"
            label="Tambahkan bahan pertama"
            severity="secondary"
            text
            size="small"
            class="mt-1"
            @click="addItem"
          />
        </div>

        <div v-else class="space-y-3">
          <!-- Desktop Table Header -->
          <div
            class="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center md:px-3 md:pb-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100"
          >
            <div class="md:col-span-1 text-center">No</div>
            <div class="md:col-span-4">Bahan Baku / Material</div>
            <div class="md:col-span-2">Kuantitas</div>
            <div class="md:col-span-2">Satuan</div>
            <div class="md:col-span-2">Catatan</div>
            <div class="md:col-span-1 text-center">Hapus</div>
          </div>

          <!-- Items Rows -->
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="relative grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-4 rounded-lg border border-slate-200 md:border-none p-4 md:p-2 shadow-sm md:shadow-none md:items-center bg-white md:bg-transparent"
          >
            <!-- Index / No -->
            <div
              class="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 md:static md:h-auto md:w-auto md:bg-transparent md:text-sm md:text-slate-400 md:col-span-1 md:text-center"
            >
              {{ index + 1 }}
            </div>

            <!-- Material Dropdown -->
            <div class="md:col-span-4 space-y-1">
              <label class="block text-xs font-semibold text-slate-500 md:hidden">Material</label>
              <Select
                v-model="item.material_id"
                :options="materialOptions"
                option-label="label"
                option-value="value"
                placeholder="Pilih Bahan Baku"
                class="w-full"
                filter
                :invalid="Boolean(getFieldError(`items.${index}.material_id`))"
                @update:model-value="handleMaterialChange(index, $event)"
              />
              <p v-if="getFieldError(`items.${index}.material_id`)" class="text-xs text-red-600">
                {{ getFieldError(`items.${index}.material_id`) }}
              </p>
            </div>

            <!-- Qty Input -->
            <div class="md:col-span-2 space-y-1">
              <label class="block text-xs font-semibold text-slate-500 md:hidden">Kuantitas</label>
              <InputNumber
                v-model="item.qty_needed"
                placeholder="Qty"
                class="w-full"
                input-class="w-full"
                :min="0.0001"
                :max-fraction-digits="4"
                mode="decimal"
                :invalid="Boolean(getFieldError(`items.${index}.qty_needed`))"
              />
              <p v-if="getFieldError(`items.${index}.qty_needed`)" class="text-xs text-red-600">
                {{ getFieldError(`items.${index}.qty_needed`) }}
              </p>
            </div>

            <!-- Unit (Read-only Input) -->
            <div class="md:col-span-2 space-y-1">
              <label class="block text-xs font-semibold text-slate-500 md:hidden">Satuan</label>
              <InputText
                :value="getMaterialUnitName(item.material_id)"
                class="w-full"
                disabled
                placeholder="Satuan"
              />
            </div>

            <!-- Notes -->
            <div class="md:col-span-2 space-y-1">
              <label class="block text-xs font-semibold text-slate-500 md:hidden">Catatan</label>
              <InputText
                v-model="item.notes"
                placeholder="Catatan..."
                class="w-full"
                autocomplete="off"
              />
            </div>

            <!-- Delete Button -->
            <div class="md:col-span-1 text-center self-end md:self-center">
              <Button
                type="button"
                icon="pi pi-trash"
                severity="danger"
                outlined
                size="small"
                aria-label="Hapus bahan"
                @click="removeItem(index)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <Button
          type="button"
          label="Batal"
          severity="secondary"
          outlined
          :disabled="submitting"
          @click="closeDialog"
        />
        <Button
          type="submit"
          :label="submitLabel"
          :loading="submitting"
          severity="teal"
          class="bg-teal-600 text-white hover:bg-teal-700"
        />
      </div>
    </form>
  </Dialog>
</template>
