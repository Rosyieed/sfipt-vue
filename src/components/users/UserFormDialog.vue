<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import type { ApiValidationErrors } from '@/types/auth'
import type { Permission, Role } from '@/types/role'
import type { User, UserPayload } from '@/types/user'

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  user: User | null
  roles: Role[]
  permissions: Permission[]
  submitting: boolean
  loadingOptions: boolean
  errors: ApiValidationErrors
  message: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [payload: UserPayload]
}>()

const form = reactive<UserPayload>({
  name: '',
  email: '',
  password: '',
  roles: [],
  permissions: [],
})

const title = computed(() => (props.mode === 'edit' ? 'Edit User' : 'Tambah User'))
const submitLabel = computed(() => (props.mode === 'edit' ? 'Simpan Perubahan' : 'Simpan User'))
const passwordHelp = computed(() =>
  props.mode === 'edit' ? 'Kosongkan jika password tidak ingin diubah.' : 'Minimal 8 karakter.',
)

const roleOptions = computed(() =>
  props.roles.map((role) => ({
    label: role.name,
    value: role.name,
  })),
)

const permissionOptions = computed(() =>
  props.permissions.map((permission) => ({
    label: permission.name,
    value: permission.name,
  })),
)

watch(
  () => [props.visible, props.user, props.mode] as const,
  () => {
    if (!props.visible) {
      return
    }

    form.name = props.user?.name ?? ''
    form.email = props.user?.email ?? ''
    form.password = ''
    form.roles = normalizeNameList(props.user?.roles)
    form.permissions = normalizeNameList(props.user?.permissions)
  },
  { immediate: true },
)

function closeDialog() {
  emit('update:visible', false)
}

function submitForm() {
  emit('submit', {
    name: form.name,
    email: form.email,
    password: form.password || undefined,
    roles: [...form.roles],
    permissions: [...form.permissions],
  })
}

function getFieldError(field: keyof UserPayload) {
  return props.errors[field]?.[0] ?? ''
}

function normalizeNameList(items?: Array<string | Role | Permission>) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => (typeof item === 'string' ? item : item.name)).filter(Boolean)
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
          <label for="user-name" class="block text-sm font-medium text-slate-700">Nama</label>
          <InputText
            id="user-name"
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
          <label for="user-email" class="block text-sm font-medium text-slate-700">Email</label>
          <InputText
            id="user-email"
            v-model="form.email"
            class="w-full"
            type="email"
            :invalid="Boolean(getFieldError('email'))"
            autocomplete="off"
          />
          <p v-if="getFieldError('email')" class="text-sm text-red-600">
            {{ getFieldError('email') }}
          </p>
        </div>
      </div>

      <div class="space-y-2">
        <label for="user-password" class="block text-sm font-medium text-slate-700">
          Password
        </label>
        <InputText
          id="user-password"
          v-model="form.password"
          class="w-full"
          type="password"
          :invalid="Boolean(getFieldError('password'))"
          autocomplete="new-password"
        />
        <p v-if="getFieldError('password')" class="text-sm text-red-600">
          {{ getFieldError('password') }}
        </p>
        <p v-else class="text-sm text-slate-500">{{ passwordHelp }}</p>
      </div>

      <div class="grid gap-5 md:grid-cols-2">
        <div class="space-y-2">
          <label for="user-roles" class="block text-sm font-medium text-slate-700">Roles</label>
          <MultiSelect
            id="user-roles"
            v-model="form.roles"
            class="w-full"
            append-to="body"
            filter
            :loading="loadingOptions"
            :max-selected-labels="2"
            :options="roleOptions"
            option-label="label"
            option-value="value"
            panel-class="user-select-panel"
            :panel-style="{ maxWidth: 'min(28rem, calc(100vw - 3rem))', width: '100%' }"
            placeholder="Pilih role"
            scroll-height="16rem"
            selected-items-label="{0} role dipilih"
            :invalid="Boolean(getFieldError('roles'))"
          />
          <p v-if="getFieldError('roles')" class="text-sm text-red-600">
            {{ getFieldError('roles') }}
          </p>
          <p v-else class="text-sm text-slate-500">{{ form.roles.length }} role dipilih</p>
        </div>

        <div class="space-y-2">
          <label for="user-permissions" class="block text-sm font-medium text-slate-700">
            Permission Tambahan
          </label>
          <MultiSelect
            id="user-permissions"
            v-model="form.permissions"
            class="w-full"
            append-to="body"
            filter
            :loading="loadingOptions"
            :max-selected-labels="2"
            :options="permissionOptions"
            option-label="label"
            option-value="value"
            panel-class="user-select-panel"
            :panel-style="{ maxWidth: 'min(28rem, calc(100vw - 3rem))', width: '100%' }"
            placeholder="Opsional"
            scroll-height="16rem"
            selected-items-label="{0} permission dipilih"
            :invalid="Boolean(getFieldError('permissions'))"
          />
          <p v-if="getFieldError('permissions')" class="text-sm text-red-600">
            {{ getFieldError('permissions') }}
          </p>
          <p v-else class="text-sm text-slate-500">
            {{ form.permissions.length }} permission tambahan dipilih
          </p>
        </div>
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
.user-select-panel {
  max-width: min(28rem, calc(100vw - 3rem));
}

.user-select-panel .p-multiselect-option {
  min-width: 0;
  white-space: normal;
  word-break: break-word;
}
</style>
