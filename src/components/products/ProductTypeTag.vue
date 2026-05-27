<script setup lang="ts">
import Tag from 'primevue/tag'
import type { ProductType } from '@/types/product'

type Props = {
  type: ProductType
}

defineProps<Props>()

const typeLabels: Record<ProductType, string> = {
  raw_material: 'Bahan Baku',
  finished_good: 'Barang Jadi',
  semi_finished: 'Setengah Jadi',
  packaging: 'Kemasan',
}

const typeSeverities: Record<ProductType, 'success' | 'info' | 'warn' | 'secondary'> = {
  raw_material: 'info',
  finished_good: 'success',
  semi_finished: 'warn',
  packaging: 'secondary',
}
</script>

<template>
  <Tag :value="typeLabels[type]" :severity="typeSeverities[type]" />
</template>
