<script setup lang="ts">
import Tag from 'primevue/tag'
import type { WarehouseType } from '@/types/warehouse'

type Props = {
  type: WarehouseType
}

defineProps<Props>()

const typeLabels: Record<WarehouseType, string> = {
  raw: 'Bahan Baku',
  wip: 'Dalam Proses',
  finished: 'Barang Jadi',
  general: 'General',
}

const typeSeverities: Record<WarehouseType, 'info' | 'warn' | 'success' | 'secondary'> = {
  raw: 'info',
  wip: 'warn',
  finished: 'success',
  general: 'secondary',
}
</script>

<template>
  <Tag :value="typeLabels[type]" :severity="typeSeverities[type]" />
</template>
