<script setup lang="ts">
import Tag from 'primevue/tag'

type Props = {
  active: boolean
}

defineProps<Props>()
</script>

<template>
  <Tag :value="active ? 'Aktif' : 'Tidak Aktif'" :severity="active ? 'success' : 'secondary'" />
</template>
