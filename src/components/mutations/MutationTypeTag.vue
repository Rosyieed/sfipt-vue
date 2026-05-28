<script setup lang="ts">
import Tag from 'primevue/tag'
import type { StockMutationType } from '@/types/stockMutation'

type Props = {
  type: StockMutationType
}

defineProps<Props>()

const typeLabels: Record<StockMutationType, string> = {
  in: 'Masuk',
  out: 'Keluar',
  transfer: 'Transfer',
  adjustment: 'Adjustment',
}

const typeSeverities: Record<StockMutationType, 'success' | 'danger' | 'info' | 'warn'> = {
  in: 'success',
  out: 'danger',
  transfer: 'info',
  adjustment: 'warn',
}
</script>

<template>
  <Tag :value="typeLabels[type]" :severity="typeSeverities[type]" />
</template>
