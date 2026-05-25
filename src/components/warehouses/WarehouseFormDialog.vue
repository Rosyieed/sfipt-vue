<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import type { ApiValidationErrors } from '@/types/auth'
import type { Warehouse, WarehousePayload, WarehouseType } from '@/types/warehouse'

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  warehouse: Warehouse | null
  submitting: boolean
  errors: ApiValidationErrors
  message: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [payload: WarehousePayload]
}>()

const form = reactive<WarehousePayload>({
  code: '',
  name: '',
  location: null,
  type: 'raw',
  is_active: true,
})

const title = computed(() => (props.mode === 'edit' ? 'Edit Gudang' : 'Tambah Gudang'))
const submitLabel = computed(() => (props.mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Gudang'))

const typeOptions: Array<{ label: string; value: WarehouseType }> = [
  { label: 'Bahan Baku', value: 'raw' },
  { label: 'Dalam Proses', value: 'wip' },
  { label: 'Barang Jadi', value: 'finished' },
  { label: 'General', value: 'general' },
]

watch(
  () => [props.visible, props.warehouse, props.mode] as const,
  () => {
    if (!props.visible) {
      return
    }

    form.code = props.warehouse?.code ?? ''
    form.name = props.warehouse?.name ?? ''
    form.location = props.warehouse?.location ?? null
    form.type = props.warehouse?.type ?? 'raw'
    form.is_active = props.warehouse?.is_active ?? true
  },
  { immediate: true },
)

function closeDialog() {
  emit('update:visible', false)
}

function submitForm() {
  emit('submit', {
    ...form,
    location: form.location?.trim() ? form.location : null,
  })
}

function getFieldError(field: keyof WarehousePayload) {
  return props.errors[field]?.[0] ?? ''
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="title"
    class="w-[calc(100vw-2rem)] max-w-3xl"
    @update:visible="emit('update:visible', $event)"
  >
    <Message v-if="message" class="mb-4" severity="error" :closable="false">
      {{ message }}
    </Message>

    <form class="space-y-5" novalidate @submit.prevent="submitForm">
      <div class="grid gap-5 md:grid-cols-2">
        <div class="space-y-2">
          <label for="warehouse-code" class="block text-sm font-medium text-slate-700">
            Kode
          </label>
          <InputText
            id="warehouse-code"
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
          <label for="warehouse-name" class="block text-sm font-medium text-slate-700">
            Nama
          </label>
          <InputText
            id="warehouse-name"
            v-model="form.name"
            class="w-full"
            :invalid="Boolean(getFieldError('name'))"
            autocomplete="off"
          />
          <p v-if="getFieldError('name')" class="text-sm text-red-600">
            {{ getFieldError('name') }}
          </p>
        </div>

      </div>

      <div class="grid gap-5 md:grid-cols-2">
        <div class="space-y-2">
          <label for="warehouse-location" class="block text-sm font-medium text-slate-700">
            Lokasi
          </label>
          <InputText
            id="warehouse-location"
            v-model="form.location"
            class="w-full"
            :invalid="Boolean(getFieldError('location'))"
            autocomplete="off"
          />
          <p v-if="getFieldError('location')" class="text-sm text-red-600">
            {{ getFieldError('location') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="warehouse-type" class="block text-sm font-medium text-slate-700">
            Tipe
          </label>
          <Select
            id="warehouse-type"
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
      </div>

      <div class="app-toggle-panel flex items-center justify-between">
        <div>
          <label for="warehouse-active" class="text-sm font-medium text-slate-800">
            Status aktif
          </label>
          <p class="mt-1 text-sm text-slate-500">
            Nonaktifkan jika gudang belum digunakan operasional.
          </p>
        </div>
        <ToggleSwitch v-model="form.is_active" input-id="warehouse-active" />
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
