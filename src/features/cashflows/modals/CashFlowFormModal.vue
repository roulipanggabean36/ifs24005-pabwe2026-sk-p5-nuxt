<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { SOURCE_OPTIONS, TYPE_OPTIONS } from '~/features/cashflows/constants'
import BaseModal from '~/features/cashflows/modals/BaseModal.vue'
import type {
  CashFlow,
  CashFlowPayload,
  CashFlowSource,
  CashFlowType,
} from '~/features/cashflows/types'
import { useInput } from '~/hooks/useInput'

const props = defineProps<{
  open: boolean
  /** Diisi saat mengubah transaksi; kosong berarti menambah transaksi baru */
  cashFlow?: CashFlow | null
  labels: string[]
  saving: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: CashFlowPayload]
}>()

const FIELD_CLASS =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30'
const LABEL_CLASS = 'mb-1.5 block text-sm font-semibold text-slate-700'

const type = ref<CashFlowType>('outflow')
const source = ref<CashFlowSource>('cash')
const { value: label, onInput: onLabelInput } = useInput<string>('')
const { value: description, onInput: onDescriptionInput } = useInput<string>('')
const { value: nominal, onInput: onNominalInput } = useInput<string>('')
const error = ref('')

const isEdit = computed(() => Boolean(props.cashFlow))

const populate = (): void => {
  error.value = ''
  if (props.cashFlow) {
    type.value = props.cashFlow.type
    source.value = props.cashFlow.source
    label.value = props.cashFlow.label
    description.value = props.cashFlow.description
    nominal.value = String(props.cashFlow.nominal)
  } else {
    type.value = 'outflow'
    source.value = 'cash'
    label.value = ''
    description.value = ''
    nominal.value = ''
  }
}

// Form diisi ulang setiap kali modal dibuka, sehingga sisa isian lama tidak terbawa
watch(
  () => props.open,
  (open) => {
    if (open) populate()
  },
  { immediate: true },
)

const validate = (): string => {
  if (!label.value.trim()) return 'Label wajib diisi.'
  if (!description.value.trim()) return 'Deskripsi wajib diisi.'

  const amount = Number(nominal.value)
  if (!Number.isInteger(amount) || amount <= 0) {
    return 'Nominal harus berupa bilangan bulat lebih dari 0.'
  }
  return ''
}

const onSubmit = (): void => {
  error.value = validate()
  if (error.value) return

  emit('submit', {
    type: type.value,
    source: source.value,
    label: label.value.trim(),
    description: description.value.trim(),
    nominal: Number(nominal.value),
  })
}
</script>

<template>
  <BaseModal :open="open" :title="isEdit ? 'Ubah transaksi' : 'Tambah transaksi'" @close="emit('close')">
    <form class="space-y-5" novalidate @submit.prevent="onSubmit">
      <fieldset>
        <legend :class="LABEL_CLASS">Jenis transaksi</legend>
        <div class="grid grid-cols-2 gap-2">
          <label v-for="option in TYPE_OPTIONS" :key="option.value" class="relative block">
            <input
              v-model="type"
              type="radio"
              name="cashflow-type"
              :value="option.value"
              class="peer sr-only"
            />
            <span
              class="block cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-600 transition peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40"
            >
              {{ option.label }}
            </span>
          </label>
        </div>
      </fieldset>

      <div>
        <label for="cashflow-source" :class="LABEL_CLASS">Sumber dana</label>
        <select id="cashflow-source" v-model="source" :class="FIELD_CLASS">
          <option v-for="option in SOURCE_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div>
        <label for="cashflow-label" :class="LABEL_CLASS">Label</label>
        <input
          id="cashflow-label"
          type="text"
          list="cashflow-label-options"
          autocomplete="off"
          placeholder="Contoh: gaji, alat-mandi"
          :value="label"
          :class="FIELD_CLASS"
          @input="onLabelInput"
        />
        <datalist id="cashflow-label-options">
          <option v-for="item in labels" :key="item" :value="item" />
        </datalist>
      </div>

      <div>
        <label for="cashflow-nominal" :class="LABEL_CLASS">Nominal (Rp)</label>
        <input
          id="cashflow-nominal"
          type="number"
          inputmode="numeric"
          min="1"
          step="1"
          placeholder="0"
          :value="nominal"
          :class="FIELD_CLASS"
          @input="onNominalInput"
        />
      </div>

      <div>
        <label for="cashflow-description" :class="LABEL_CLASS">Deskripsi</label>
        <textarea
          id="cashflow-description"
          rows="3"
          placeholder="Catatan singkat tentang transaksi ini"
          :value="description"
          :class="FIELD_CLASS"
          @input="onDescriptionInput"
        />
      </div>

      <p v-if="error" role="alert" class="text-sm font-medium text-expense">{{ error }}</p>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          @click="emit('close')"
        >
          Batal
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isEdit ? 'Simpan perubahan' : 'Simpan transaksi' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
