<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BrowserCodeReader, BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { ApiError } from '@/services/apiClient'
import * as stockService from '@/services/stockService'
import { useAuthStore } from '@/stores/auth'
import type { Stock, StockScanResult } from '@/types/stock'

type Props = {
  visible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const authStore = useAuthStore()
const router = useRouter()

const scanMessage = ref('')
const scanErrorMessage = ref('')
const scannedBarcode = ref('')
const scannedResult = ref<StockScanResult | null>(null)
const isScanning = ref(false)
const isCameraScanning = ref(false)
const scanHint = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)
const scanResultRef = ref<HTMLElement | null>(null)
const scannerControls = ref<IScannerControls | null>(null)

const barcodeFormats = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
]

onBeforeUnmount(() => {
  stopCameraScanner()
})

function resetScannerState() {
  scannedBarcode.value = ''
  scannedResult.value = null
  scanMessage.value = ''
  scanErrorMessage.value = ''
  scanHint.value = ''
}

function closeDialog() {
  stopCameraScanner()
  emit('update:visible', false)
}

function handleVisibleChange(value: boolean) {
  if (value) {
    resetScannerState()
    emit('update:visible', true)
    return
  }

  closeDialog()
}

async function startCameraScanner() {
  scanErrorMessage.value = ''
  scanMessage.value = ''
  scanHint.value = ''
  scannedResult.value = null

  if (!navigator.mediaDevices?.getUserMedia) {
    scanErrorMessage.value = 'Akses kamera belum tersedia di browser ini.'
    return
  }

  try {
    await nextTick()

    if (!videoRef.value) {
      return
    }

    isCameraScanning.value = true
    scanHint.value = 'Arahkan kamera ke barcode produk.'
    const reader = createBarcodeReader()
    scannerControls.value = await reader.decodeFromConstraints(
      {
        video: {
          facingMode: {
            ideal: 'environment',
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      },
      videoRef.value,
      (result, error) => {
        const barcode = result?.getText()

        if (!barcode || isScanning.value) {
          if (error && !scanHint.value) {
            scanHint.value = 'Scanner aktif. Dekatkan kamera sampai barcode terlihat tajam.'
          }
          return
        }

        stopCameraScanner()
        scannedBarcode.value = barcode
        void scanBarcode()
      },
    )
  } catch (error) {
    scanErrorMessage.value =
      error instanceof Error
        ? `Kamera tidak bisa dibuka: ${error.message}`
        : 'Kamera tidak bisa dibuka. Pastikan izin kamera sudah diberikan.'
    stopCameraScanner()
  }
}

function stopCameraScanner() {
  scannerControls.value?.stop()
  scannerControls.value = null
  BrowserCodeReader.releaseAllStreams()
  isCameraScanning.value = false
  scanHint.value = ''

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

function createBarcodeReader() {
  const hints = new Map<DecodeHintType, unknown>()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, barcodeFormats)
  hints.set(DecodeHintType.TRY_HARDER, true)

  return new BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: 150,
    delayBetweenScanSuccess: 300,
    tryPlayVideoTimeout: 8000,
  })
}

async function scanBarcode() {
  const barcode = scannedBarcode.value.trim()

  if (!barcode) {
    scanErrorMessage.value = 'Masukkan barcode terlebih dahulu.'
    return
  }

  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isScanning.value = true
  scanMessage.value = ''
  scanErrorMessage.value = ''
  scannedResult.value = null

  try {
    const result = await stockService.scanStockBarcode(authStore.token, barcode)
    scannedResult.value = result
    scanMessage.value = `Produk ditemukan: ${result.product.name}`
    await focusScanResult()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
      return
    }

    scanErrorMessage.value = error instanceof ApiError ? error.message : 'Barcode belum ditemukan.'
  } finally {
    isScanning.value = false
  }
}

async function focusScanResult() {
  await nextTick()

  scanResultRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function formatQty(value: string | number | undefined) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0))
}

function getUnitName(stock: Stock) {
  return stock.product?.unit?.name ?? ''
}

function getWarehouseName(stock: Stock) {
  return stock.warehouse?.name ?? `Gudang #${stock.warehouse_id}`
}

function getWarehouseCode(stock: Stock) {
  return stock.warehouse?.code ?? '-'
}

function isLowStock(stock: Stock) {
  if (typeof stock.is_low_stock === 'boolean') {
    return stock.is_low_stock
  }

  return Number(stock.qty) < Number(stock.product?.min_stock ?? 0)
}

function getStockRowClass(row: Stock) {
  return isLowStock(row) ? 'stock-row--low' : ''
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Scan Stok Produk"
    class="w-[calc(100vw-2rem)] max-w-3xl"
    @update:visible="handleVisibleChange"
  >
    <Message v-if="scanErrorMessage" class="mb-4" severity="error" :closable="false">
      {{ scanErrorMessage }}
    </Message>
    <Message v-if="scanMessage" class="mb-4" severity="success" :closable="false">
      {{ scanMessage }}
    </Message>
    <Message v-if="scanHint" class="mb-4" severity="info" :closable="false">
      {{ scanHint }}
    </Message>

    <div class="stock-camera-frame">
      <video ref="videoRef" class="aspect-video w-full object-cover" muted playsinline></video>
      <div v-if="isCameraScanning" class="stock-scan-guide">
        <span></span>
      </div>
    </div>

    <div class="mt-4 flex flex-col gap-2 sm:flex-row">
      <Button
        :label="isCameraScanning ? 'Scanner aktif' : 'Mulai Scan'"
        icon="pi pi-camera"
        :disabled="isCameraScanning || isScanning"
        @click="startCameraScanner"
      />
      <Button
        label="Stop"
        icon="pi pi-stop"
        severity="secondary"
        outlined
        :disabled="!isCameraScanning"
        @click="stopCameraScanner"
      />
    </div>

    <div class="mt-5 flex flex-col gap-2 sm:flex-row">
      <InputText
        v-model="scannedBarcode"
        class="w-full"
        placeholder="Masukkan barcode produk"
        :disabled="isScanning || isCameraScanning"
        @keydown.enter.prevent="scanBarcode"
      />
      <Button
        label="Cari"
        icon="pi pi-search"
        :loading="isScanning"
        :disabled="isScanning || isCameraScanning"
        @click="scanBarcode"
      />
    </div>

    <div v-if="scannedResult" ref="scanResultRef" class="mt-5 scroll-mt-4 space-y-4">
      <div class="app-preview-panel">
        <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-teal-700">Produk</p>
        <h3 class="mt-2 text-lg font-extrabold text-slate-950">{{ scannedResult.product.name }}</h3>
        <p class="mt-1 text-sm text-slate-500">
          {{ scannedResult.product.sku }} - {{ scannedResult.product.barcode ?? '-' }}
        </p>
      </div>

      <DataTable
        :value="scannedResult.stocks"
        :row-class="getStockRowClass"
        showGridlines
        responsive-layout="scroll"
      >
        <template #empty>
          <div class="app-empty-state">Produk ini belum memiliki stok.</div>
        </template>
        <Column header="Gudang">
          <template #body="{ data }">
            <div>
              <p class="font-semibold text-slate-950">{{ getWarehouseName(data) }}</p>
              <p class="mt-1 font-mono text-xs font-semibold text-slate-500">
                {{ getWarehouseCode(data) }}
              </p>
            </div>
          </template>
        </Column>
        <Column header="Stok" body-class="text-right">
          <template #body="{ data }">
            <div>
              <p
                class="text-lg font-extrabold"
                :class="isLowStock(data) ? 'text-red-700' : 'text-slate-950'"
              >
                {{ formatQty(data.qty) }}
                <span v-if="getUnitName(data)" class="text-sm font-bold text-slate-500">
                  {{ getUnitName(data) }}
                </span>
              </p>
              <p class="mt-1 text-xs font-semibold text-slate-500">
                Min. {{ formatQty(data.product?.min_stock) }}
                <span v-if="getUnitName(data)">{{ getUnitName(data) }}</span>
              </p>
            </div>
          </template>
        </Column>
        <Column header="Status">
          <template #body="{ data }">
            <Tag :value="isLowStock(data) ? 'Stok rendah' : 'Aman'" :severity="isLowStock(data) ? 'danger' : 'success'" />
          </template>
        </Column>
      </DataTable>
    </div>

    <div class="mt-5 flex justify-end border-t border-teal-900/10 pt-5">
      <Button label="Tutup" severity="secondary" outlined @click="closeDialog" />
    </div>
  </Dialog>
</template>

<style scoped>
.stock-camera-frame {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(15, 118, 110, 0.16);
  border-radius: 0.85rem;
  background: #020617;
}

.stock-scan-guide {
  position: absolute;
  inset: 18%;
  display: grid;
  place-items: center;
  pointer-events: none;
  border: 2px solid rgba(34, 211, 238, 0.84);
  border-radius: 0.75rem;
  box-shadow:
    0 0 0 999px rgba(2, 6, 23, 0.28),
    0 0 28px rgba(8, 145, 178, 0.24);
}

.stock-scan-guide span {
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.95), transparent);
  box-shadow: 0 0 14px rgba(45, 212, 191, 0.85);
}

:deep(.stock-row--low > td) {
  background: rgba(254, 242, 242, 0.92);
}

:deep(.stock-row--low > td:first-child) {
  box-shadow: inset 4px 0 0 #dc2626;
}

:deep(.stock-row--low:hover > td) {
  background: rgba(254, 226, 226, 0.95);
}
</style>
