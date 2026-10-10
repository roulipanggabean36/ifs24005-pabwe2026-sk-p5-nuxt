<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getInitial, resolvePhotoUrl } from '~/features/users/userHelper'
import { BASE_URL } from '~/helpers/apiHelper'

const props = defineProps<{
  name: string
  photo?: string | null
}>()

// Foto yang gagal dimuat (mis. URL localhost dari server) diganti inisial nama
const failed = ref(false)

const src = computed(() => resolvePhotoUrl(props.photo ?? null, BASE_URL))

watch(
  () => props.photo,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="`Foto profil ${name}`"
    class="shrink-0 rounded-full object-cover"
    @error="failed = true"
  />
  <span
    v-else
    class="flex shrink-0 select-none items-center justify-center rounded-full bg-brand-600 font-bold text-white"
    aria-hidden="true"
  >
    {{ getInitial(name) }}
  </span>
</template>
