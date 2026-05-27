<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { BrowserCodeReader, BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { ApiError } from '@/services/apiClient'
import * as productService from '@/services/productService'
import { useAuthStore } from '@/stores/auth'
import type { Product } from '@/types/product'

type Props = {
  visible: boolean
  product: Product | null
  mode?: 'scan' | 'generate'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'scan',
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const CODE128_PATTERNS = [
  '212222',
  '222122',
  '222221',
  '121223',
  '121322',
  '131222',
  '122213',
  '122312',
  '132212',
  '221213',
  '221312',
  '231212',
  '112232',
  '122132',
  '122231',
  '113222',
  '123122',
  '123221',
  '223211',
  '221132',
  '221231',
  '213212',
  '223112',
  '312131',
  '311222',
  '321122',
  '321221',
  '312212',
  '322112',
  '322211',
  '212123',
  '212321',
  '232121',
  '111323',
  '131123',
  '131321',
  '112313',
  '132113',
  '132311',
  '211313',
  '231113',
  '231311',
  '112133',
  '112331',
  '132131',
  '113123',
  '113321',
  '133121',
  '313121',
  '211331',
  '231131',
  '213113',
  '213311',
  '213131',
  '311123',
  '311321',
  '331121',
  '312113',
  '312311',
  '332111',
  '314111',
  '221411',
  '431111',
  '111224',
  '111422',
  '121124',
  '121421',
  '141122',
  '141221',
  '112214',
  '112412',
  '122114',
  '122411',
  '142112',
  '142211',
  '241211',
  '221114',
  '413111',
  '241112',
  '134111',
  '111242',
  '121142',
  '121241',
  '114212',
  '124112',
  '124211',
  '411212',
  '421112',
  '421211',
  '212141',
  '214121',
  '412121',
  '111143',
  '111341',
  '131141',
  '114113',
  '114311',
  '411113',
  '411311',
  '113141',
  '114131',
  '311141',
  '411131',
  '211412',
  '211214',
  '211232',
  '2331112',
] as const

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

const authStore = useAuthStore()
const router = useRouter()

const videoRef = ref<HTMLVideoElement | null>(null)
const scannerControls = ref<IScannerControls | null>(null)
const isScanning = ref(false)
const isLookingUp = ref(false)
const scannerMessage = ref('')
const scannerError = ref('')
const scannerHint = ref('')
const manualBarcode = ref('')
const scannedProduct = ref<Product | null>(null)
const generatedValue = ref('')

const barcodeValue = computed(() => generatedValue.value.trim())
const barcodeError = computed(() => getBarcodeValueError(barcodeValue.value))
const barcodeBars = computed(() => {
  if (barcodeError.value) {
    return []
  }

  return generateCode128Bars(barcodeValue.value)
})
const barcodeWidth = computed(() => getBarcodeWidth(barcodeBars.value))
const showScanner = computed(() => props.mode === 'scan')
const showGenerator = computed(() => props.mode === 'generate')
const dialogTitle = computed(() => (showScanner.value ? 'Scan Barcode Produk' : 'Generate Barcode Produk'))
const dialogClass = computed(() =>
  showScanner.value ? 'w-[calc(100vw-2rem)] max-w-3xl' : 'w-[calc(100vw-2rem)] max-w-xl',
)

watch(
  () => [props.visible, props.product] as const,
  ([visible]) => {
    if (!visible) {
      stopScanner()
      return
    }

    scannerMessage.value = ''
    scannerError.value = ''
    scannerHint.value = ''
    manualBarcode.value = ''
    scannedProduct.value = null
    generatedValue.value = props.product?.barcode || props.product?.sku || ''
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopScanner()
})

function closeDialog() {
  emit('update:visible', false)
}

async function startScanner() {
  scannerError.value = ''
  scannerMessage.value = ''
  scannerHint.value = ''
  scannedProduct.value = null

  if (!navigator.mediaDevices?.getUserMedia) {
    scannerError.value = 'Akses kamera belum tersedia di browser ini.'
    return
  }

  try {
    await nextTick()

    if (!videoRef.value) {
      return
    }

    isScanning.value = true
    scannerMessage.value = 'Arahkan kamera ke barcode produk.'
    scannerHint.value = 'Pastikan barcode memenuhi area kamera, terang, dan tidak miring.'
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

        if (!barcode || isLookingUp.value) {
          if (error && !scannerHint.value) {
            scannerHint.value = 'Scanner aktif. Dekatkan kamera sampai garis barcode terlihat tajam.'
          }
          return
        }

        stopScanner()
        manualBarcode.value = barcode
        void lookupBarcode(barcode)
      },
    )
  } catch (error) {
    scannerError.value =
      error instanceof Error
        ? `Kamera tidak bisa dibuka: ${error.message}`
        : 'Kamera tidak bisa dibuka. Pastikan izin kamera sudah diberikan.'
    stopScanner()
  }
}

function stopScanner() {
  scannerControls.value?.stop()
  scannerControls.value = null
  BrowserCodeReader.releaseAllStreams()
  isScanning.value = false
  scannerHint.value = ''

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

async function lookupManualBarcode() {
  await lookupBarcode(manualBarcode.value)
}

async function lookupBarcode(rawBarcode: string) {
  const barcode = rawBarcode.trim()

  if (!barcode) {
    scannerError.value = 'Masukkan barcode terlebih dahulu.'
    return
  }

  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLookingUp.value = true
  scannerError.value = ''
  scannerMessage.value = ''
  scannedProduct.value = null

  try {
    const product = await productService.getProductByBarcode(authStore.token, barcode)
    scannedProduct.value = product
    generatedValue.value = product.barcode || product.sku
    scannerMessage.value = `Produk ditemukan: ${product.name}`
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
      return
    }

    scannerError.value =
      error instanceof ApiError ? error.message : 'Produk dengan barcode ini tidak ditemukan.'
  } finally {
    isLookingUp.value = false
  }
}

function useProductBarcode() {
  if (!props.product) {
    return
  }

  generatedValue.value = props.product.barcode || props.product.sku
}

function useScannedBarcode() {
  if (!manualBarcode.value.trim()) {
    return
  }

  generatedValue.value = manualBarcode.value.trim()
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

function downloadBarcodePng() {
  if (!barcodeValue.value || barcodeError.value) {
    return
  }

  const scale = 4
  const canvas = document.createElement('canvas')
  canvas.width = barcodeWidth.value * scale
  canvas.height = 320

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#0f172a'

  barcodeBars.value.forEach((bar) => {
    context.fillRect(bar.x * scale, 34, bar.width * scale, 210)
  })

  context.fillStyle = '#334155'
  context.font = '28px Arial, sans-serif'
  context.textAlign = 'center'
  context.fillText(barcodeValue.value, canvas.width / 2, 292)

  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = `barcode-${barcodeValue.value.replace(/[^a-z0-9-]+/gi, '-')}.png`
  link.click()
}

function getBarcodeValueError(value: string) {
  if (!value) {
    return 'Masukkan nilai barcode terlebih dahulu.'
  }

  if ([...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) > 127)) {
    return 'Barcode Code 128 hanya mendukung karakter ASCII standar.'
  }

  return ''
}

function generateCode128Bars(value: string) {
  const codes = [104, ...[...value].map((char) => char.charCodeAt(0) - 32)]
  const checksum = codes.reduce((total, code, index) => total + code * (index === 0 ? 1 : index), 0)
  const encoded = [...codes, checksum % 103, 106]
  const bars: Array<{ x: number; width: number }> = []
  let x = 10

  for (const code of encoded) {
    const pattern = CODE128_PATTERNS[code]

    if (!pattern) {
      continue
    }

    ;[...pattern].forEach((widthChar, index) => {
      const width = Number(widthChar)
      if (index % 2 === 0) {
        bars.push({ x, width })
      }
      x += width
    })
  }

  return bars
}

function getBarcodeWidth(bars: Array<{ x: number; width: number }>) {
  const lastBar = bars.at(-1)
  return (lastBar ? lastBar.x + lastBar.width : 0) + 10
}

</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="dialogTitle"
    :class="dialogClass"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="grid gap-5">
      <section v-if="showScanner" class="barcode-panel">
        <div class="barcode-panel__header">
          <span class="barcode-panel__icon">
            <i class="pi pi-camera"></i>
          </span>
          <div>
            <h3 class="text-base font-extrabold text-slate-950">Scan Barcode</h3>
            <p class="mt-1 text-sm text-slate-500">Cari produk langsung dari barcode fisik.</p>
          </div>
        </div>

        <Message v-if="scannerError" class="mb-4" severity="error" :closable="false">
          {{ scannerError }}
        </Message>
        <Message v-if="scannerMessage" class="mb-4" severity="success" :closable="false">
          {{ scannerMessage }}
        </Message>
        <Message v-if="scannerHint" class="mb-4" severity="info" :closable="false">
          {{ scannerHint }}
        </Message>

        <div class="barcode-camera-frame">
          <video ref="videoRef" class="aspect-video w-full object-cover" muted playsinline></video>
          <div v-if="isScanning" class="barcode-scan-guide">
            <span></span>
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            :label="isScanning ? 'Scanner aktif' : 'Mulai Scan'"
            icon="pi pi-camera"
            :disabled="isScanning || isLookingUp"
            @click="startScanner"
          />
          <Button
            label="Stop"
            icon="pi pi-stop"
            severity="secondary"
            outlined
            :disabled="!isScanning"
            @click="stopScanner"
          />
        </div>

        <div class="mt-5 space-y-2">
          <label for="manual-barcode" class="block text-sm font-bold text-slate-700">
            Input barcode manual
          </label>
          <div class="flex flex-col gap-2 sm:flex-row">
            <InputText
              id="manual-barcode"
              v-model="manualBarcode"
              class="w-full"
              placeholder="Contoh: 899000000001"
              :disabled="isLookingUp"
              @keydown.enter.prevent="lookupManualBarcode"
            />
            <Button
              label="Cari"
              icon="pi pi-search"
              :loading="isLookingUp"
              :disabled="isLookingUp"
              @click="lookupManualBarcode"
            />
          </div>
        </div>

        <div v-if="scannedProduct" class="mt-5 rounded-xl border border-teal-900/10 bg-white/80 p-4">
          <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-teal-700">
            Produk ditemukan
          </p>
          <h4 class="mt-2 text-lg font-extrabold text-slate-950">{{ scannedProduct.name }}</h4>
          <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt class="font-semibold text-slate-500">SKU</dt>
              <dd class="mt-1 text-slate-950">{{ scannedProduct.sku }}</dd>
            </div>
            <div>
              <dt class="font-semibold text-slate-500">Barcode</dt>
              <dd class="mt-1 text-slate-950">{{ scannedProduct.barcode ?? '-' }}</dd>
            </div>
            <div>
              <dt class="font-semibold text-slate-500">Kategori</dt>
              <dd class="mt-1 text-slate-950">{{ scannedProduct.category?.name ?? '-' }}</dd>
            </div>
            <div>
              <dt class="font-semibold text-slate-500">Satuan</dt>
              <dd class="mt-1 text-slate-950">{{ scannedProduct.unit?.name ?? '-' }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section v-if="showGenerator" class="barcode-panel">
        <div class="barcode-panel__header">
          <span class="barcode-panel__icon">
            <i class="pi pi-barcode"></i>
          </span>
          <div>
            <h3 class="text-base font-extrabold text-slate-950">Generate Barcode</h3>
            <p class="mt-1 text-sm text-slate-500">Buat barcode Code 128 untuk label produk.</p>
          </div>
        </div>

        <div class="space-y-2">
          <label for="generated-barcode" class="block text-sm font-bold text-slate-700">
            Nilai barcode
          </label>
          <InputText
            id="generated-barcode"
            v-model="generatedValue"
            class="w-full"
            placeholder="Masukkan barcode atau SKU"
          />
          <p v-if="barcodeError" class="text-sm text-red-600">{{ barcodeError }}</p>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <Button
            v-if="product"
            label="Gunakan Barcode Produk"
            icon="pi pi-box"
            severity="secondary"
            outlined
            @click="useProductBarcode"
          />
          <Button
            v-if="manualBarcode"
            label="Pakai hasil scan"
            icon="pi pi-camera"
            severity="secondary"
            outlined
            @click="useScannedBarcode"
          />
          <Button
            label="Download Barcode"
            icon="pi pi-download"
            severity="secondary"
            outlined
            :disabled="Boolean(barcodeError)"
            @click="downloadBarcodePng"
          />
        </div>

        <div class="mt-5 rounded-xl border border-teal-900/10 bg-white p-4 shadow-sm">
          <svg
            v-if="barcodeBars.length"
            class="h-auto w-full"
            :viewBox="`0 0 ${barcodeWidth} 112`"
            role="img"
            :aria-label="`Barcode ${barcodeValue}`"
          >
            <rect width="100%" height="100%" fill="#ffffff" />
            <g fill="#0f172a">
              <rect
                v-for="bar in barcodeBars"
                :key="`${bar.x}-${bar.width}`"
                :x="bar.x"
                y="12"
                :width="bar.width"
                height="74"
              />
            </g>
            <text
              :x="barcodeWidth / 2"
              y="104"
              text-anchor="middle"
              font-family="Inter, Arial, sans-serif"
              font-size="10"
              fill="#334155"
            >
              {{ barcodeValue }}
            </text>
          </svg>
          <div v-else class="app-empty-state">Barcode akan tampil setelah nilainya diisi.</div>
        </div>
      </section>
    </div>

    <div class="mt-5 flex justify-end border-t border-teal-900/10 pt-5">
      <Button label="Tutup" severity="secondary" outlined @click="closeDialog" />
    </div>
  </Dialog>
</template>

<style scoped>
.barcode-panel {
  border: 1px solid var(--sf-border);
  border-radius: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.88)),
    linear-gradient(135deg, rgba(14, 165, 233, 0.08), transparent 42%);
  padding: 1rem;
}

.barcode-panel__header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.barcode-panel__icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  border: 1px solid rgba(15, 118, 110, 0.18);
  border-radius: 0.85rem;
  background: rgba(240, 253, 250, 0.9);
  color: var(--sf-primary);
  box-shadow: 0 8px 18px rgba(15, 118, 110, 0.08);
}

.barcode-camera-frame {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(15, 118, 110, 0.16);
  border-radius: 0.85rem;
  background: #020617;
}

.barcode-scan-guide {
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

.barcode-scan-guide span {
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.95), transparent);
  box-shadow: 0 0 14px rgba(45, 212, 191, 0.85);
}
</style>
