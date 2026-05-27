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
import type { Category } from '@/types/category'
import type { Product, ProductPayload, ProductType } from '@/types/product'
import type { Unit } from '@/types/unit'

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  product: Product | null
  categories: Category[]
  units: Unit[]
  submitting: boolean
  errors: ApiValidationErrors
  message: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [payload: ProductPayload]
}>()

const form = reactive<ProductPayload>({
  sku: '',
  barcode: null,
  name: '',
  category_id: null,
  unit_id: null,
  type: 'raw_material',
  min_stock: 0,
  description: null,
  is_active: true,
})

const title = computed(() => (props.mode === 'edit' ? 'Edit Produk' : 'Tambah Produk'))
const submitLabel = computed(() => (props.mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Produk'))

const typeOptions: Array<{ label: string; value: ProductType }> = [
  { label: 'Bahan Baku', value: 'raw_material' },
  { label: 'Barang Jadi', value: 'finished_good' },
  { label: 'Setengah Jadi', value: 'semi_finished' },
  { label: 'Kemasan', value: 'packaging' },
]

watch(
  () => [props.visible, props.product, props.mode] as const,
  () => {
    if (!props.visible) {
      return
    }

    form.sku = props.product?.sku ?? ''
    form.barcode = props.product?.barcode ?? null
    form.name = props.product?.name ?? ''
    form.category_id = props.product?.category_id ?? null
    form.unit_id = props.product?.unit_id ?? null
    form.type = props.product?.type ?? 'raw_material'
    form.min_stock = Number(props.product?.min_stock ?? 0)
    form.description = props.product?.description ?? null
    form.is_active = props.product?.is_active ?? true
  },
  { immediate: true },
)

function closeDialog() {
  emit('update:visible', false)
}

function submitForm() {
  emit('submit', {
    ...form,
    sku: form.sku.trim(),
    barcode: form.barcode?.trim() ? form.barcode.trim() : null,
    name: form.name.trim(),
    min_stock: Number(form.min_stock ?? 0),
    description: form.description?.trim() ? form.description : null,
  })
}

function getFieldError(field: keyof ProductPayload) {
  return props.errors[field]?.[0] ?? ''
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="title"
    class="w-[calc(100vw-2rem)] max-w-4xl"
    @update:visible="emit('update:visible', $event)"
  >
    <Message v-if="message" class="mb-4" severity="error" :closable="false">
      {{ message }}
    </Message>

    <form class="space-y-5" novalidate @submit.prevent="submitForm">
      <div class="grid gap-5 md:grid-cols-2">
        <div class="space-y-2">
          <label for="product-sku" class="block text-sm font-medium text-slate-700">SKU</label>
          <InputText
            id="product-sku"
            v-model="form.sku"
            class="w-full"
            :invalid="Boolean(getFieldError('sku'))"
            autocomplete="off"
          />
          <p v-if="getFieldError('sku')" class="text-sm text-red-600">
            {{ getFieldError('sku') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="product-barcode" class="block text-sm font-medium text-slate-700">
            Barcode
          </label>
          <InputText
            id="product-barcode"
            v-model="form.barcode"
            class="w-full"
            :invalid="Boolean(getFieldError('barcode'))"
            autocomplete="off"
          />
          <p v-if="getFieldError('barcode')" class="text-sm text-red-600">
            {{ getFieldError('barcode') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="product-name" class="block text-sm font-medium text-slate-700">Nama</label>
          <InputText
            id="product-name"
            v-model="form.name"
            class="w-full"
            :invalid="Boolean(getFieldError('name'))"
            autocomplete="off"
          />
          <p v-if="getFieldError('name')" class="text-sm text-red-600">
            {{ getFieldError('name') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="product-type" class="block text-sm font-medium text-slate-700">Tipe</label>
          <Select
            id="product-type"
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

        <div class="space-y-2">
          <label for="product-category" class="block text-sm font-medium text-slate-700">
            Kategori
          </label>
          <Select
            id="product-category"
            v-model="form.category_id"
            class="w-full"
            :options="categories"
            option-label="name"
            option-value="id"
            filter
            :invalid="Boolean(getFieldError('category_id'))"
            placeholder="Pilih kategori"
          />
          <p v-if="getFieldError('category_id')" class="text-sm text-red-600">
            {{ getFieldError('category_id') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="product-unit" class="block text-sm font-medium text-slate-700">Satuan</label>
          <Select
            id="product-unit"
            v-model="form.unit_id"
            class="w-full"
            :options="units"
            option-label="name"
            option-value="id"
            filter
            :invalid="Boolean(getFieldError('unit_id'))"
            placeholder="Pilih satuan"
          />
          <p v-if="getFieldError('unit_id')" class="text-sm text-red-600">
            {{ getFieldError('unit_id') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="product-min-stock" class="block text-sm font-medium text-slate-700">
            Minimum Stok
          </label>
          <InputNumber
            v-model="form.min_stock"
            input-id="product-min-stock"
            class="w-full"
            input-class="w-full"
            :min="0"
            :min-fraction-digits="0"
            :max-fraction-digits="4"
            :invalid="Boolean(getFieldError('min_stock'))"
          />
          <p v-if="getFieldError('min_stock')" class="text-sm text-red-600">
            {{ getFieldError('min_stock') }}
          </p>
        </div>
      </div>

      <div class="space-y-2">
        <label for="product-description" class="block text-sm font-medium text-slate-700">
          Deskripsi
        </label>
        <Textarea
          id="product-description"
          v-model="form.description"
          class="w-full"
          rows="4"
          :invalid="Boolean(getFieldError('description'))"
          auto-resize
        />
        <p v-if="getFieldError('description')" class="text-sm text-red-600">
          {{ getFieldError('description') }}
        </p>
      </div>

      <div class="app-toggle-panel flex items-center justify-between">
        <div>
          <label for="product-active" class="text-sm font-medium text-slate-800">
            Status aktif
          </label>
          <p class="mt-1 text-sm text-slate-500">
            Nonaktifkan jika produk belum digunakan operasional.
          </p>
        </div>
        <ToggleSwitch v-model="form.is_active" input-id="product-active" />
      </div>

      <div
        class="flex flex-col-reverse gap-3 border-t border-teal-900/10 pt-5 sm:flex-row sm:justify-end"
      >
        <Button label="Batal" severity="secondary" outlined type="button" @click="closeDialog" />
        <Button type="submit" :label="submitLabel" :loading="submitting" :disabled="submitting" />
      </div>
    </form>
  </Dialog>
</template>
