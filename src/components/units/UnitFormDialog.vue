<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import ActiveStatusTag from '@/components/common/ActiveStatusTag.vue'
import type { ApiValidationErrors } from '@/types/auth'
import type { Unit, UnitPayload } from '@/types/unit'

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  unit: Unit | null
  submitting: boolean
  errors: ApiValidationErrors
  message: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [payload: UnitPayload]
}>()

const form = reactive<UnitPayload>({
  code: '',
  name: '',
  description: null,
  is_active: true,
})

const title = computed(() => (props.mode === 'edit' ? 'Edit Satuan' : 'Tambah Satuan'))
const submitLabel = computed(() => (props.mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Satuan'))

watch(
  () => [props.visible, props.unit, props.mode] as const,
  () => {
    if (!props.visible) {
      return
    }

    form.code = props.unit?.code ?? ''
    form.name = props.unit?.name ?? ''
    form.description = props.unit?.description ?? null
    form.is_active = props.unit?.is_active ?? true
  },
  { immediate: true },
)

function closeDialog() {
  emit('update:visible', false)
}

function submitForm() {
  emit('submit', {
    ...form,
    description: form.description?.trim() ? form.description : null,
  })
}

function getFieldError(field: keyof UnitPayload) {
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

    <form class="grid gap-6 lg:grid-cols-[1fr_240px]" novalidate @submit.prevent="submitForm">
      <div class="space-y-5">
        <div class="grid gap-5 md:grid-cols-2">
          <div class="space-y-2">
            <label for="unit-code" class="block text-sm font-medium text-slate-700">
              Kode
            </label>
            <InputText
              id="unit-code"
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
            <label for="unit-name" class="block text-sm font-medium text-slate-700">
              Nama
            </label>
            <InputText
              id="unit-name"
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

        <div class="space-y-2">
          <label for="unit-description" class="block text-sm font-medium text-slate-700">
            Deskripsi
          </label>
          <Textarea
            id="unit-description"
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

        <div
          class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <div>
            <label for="unit-active" class="text-sm font-medium text-slate-800">
              Status aktif
            </label>
            <p class="mt-1 text-sm text-slate-500">
              Nonaktifkan jika satuan belum digunakan operasional.
            </p>
          </div>
          <ToggleSwitch v-model="form.is_active" input-id="unit-active" />
        </div>
      </div>

      <aside class="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p class="text-sm font-semibold text-slate-950">Pratinjau</p>
        <div class="mt-5 space-y-4 text-sm">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Kode</p>
            <p class="mt-1 font-semibold text-slate-950">{{ form.code || '-' }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Satuan</p>
            <p class="mt-1 font-semibold text-slate-950">{{ form.name || '-' }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Deskripsi</p>
            <p class="mt-1 text-slate-700">{{ form.description || '-' }}</p>
          </div>
          <div>
            <p class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Status</p>
            <ActiveStatusTag :active="form.is_active" />
          </div>
        </div>
      </aside>

      <div
        class="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end lg:col-span-2"
      >
        <Button label="Batal" severity="secondary" outlined type="button" @click="closeDialog" />
        <Button type="submit" :label="submitLabel" :loading="submitting" :disabled="submitting" />
      </div>
    </form>
  </Dialog>
</template>
