<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import type { ApiValidationErrors } from '@/types/auth'
import type { Permission, Role, RolePayload } from '@/types/role'

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  role: Role | null
  permissions: Permission[]
  submitting: boolean
  loadingPermissions: boolean
  errors: ApiValidationErrors
  message: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [payload: RolePayload]
}>()

const form = reactive<RolePayload>({
  name: '',
  permissions: [],
})

const title = computed(() => (props.mode === 'edit' ? 'Edit Role' : 'Tambah Role'))
const submitLabel = computed(() => (props.mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Role'))

const permissionOptions = computed(() =>
  props.permissions.map((permission) => ({
    label: permission.name,
    value: permission.name,
  })),
)

watch(
  () => [props.visible, props.role, props.mode] as const,
  () => {
    if (!props.visible) {
      return
    }

    form.name = props.role?.name ?? ''
    form.permissions = normalizePermissions(props.role?.permissions)
  },
  { immediate: true },
)

function closeDialog() {
  emit('update:visible', false)
}

function submitForm() {
  emit('submit', {
    name: form.name,
    permissions: [...form.permissions],
  })
}

function getFieldError(field: keyof RolePayload) {
  return props.errors[field]?.[0] ?? ''
}

function normalizePermissions(permissions?: Role['permissions']) {
  if (!Array.isArray(permissions)) {
    return []
  }

  return permissions
    .map((permission) => (typeof permission === 'string' ? permission : permission.name))
    .filter(Boolean)
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
      <div class="space-y-2">
        <label for="role-name" class="block text-sm font-medium text-slate-700">Nama Role</label>
        <InputText
          id="role-name"
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
        <label for="role-permissions" class="block text-sm font-medium text-slate-700">
          Permissions
        </label>
        <MultiSelect
          id="role-permissions"
          v-model="form.permissions"
          class="w-full"
          append-to="body"
          filter
          :loading="loadingPermissions"
          :max-selected-labels="3"
          :options="permissionOptions"
          option-label="label"
          option-value="value"
          panel-class="role-permission-panel"
          :panel-style="{ maxWidth: 'min(42rem, calc(100vw - 3rem))', width: '100%' }"
          placeholder="Pilih permission"
          scroll-height="18rem"
          selected-items-label="{0} permission dipilih"
          :invalid="Boolean(getFieldError('permissions'))"
        />
        <p v-if="getFieldError('permissions')" class="text-sm text-red-600">
          {{ getFieldError('permissions') }}
        </p>
        <p v-else class="text-sm text-slate-500">
          {{ form.permissions.length }} permission dipilih
        </p>
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

<style scoped>
:deep(.p-multiselect-label) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>

<style>
.role-permission-panel {
  max-width: min(42rem, calc(100vw - 3rem));
}

.role-permission-panel .p-multiselect-option {
  min-width: 0;
  white-space: normal;
  word-break: break-word;
}
</style>
