<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import UserAvatar from '~/features/users/components/UserAvatar.vue'
import { useUsersStore } from '~/features/users/usersStore'
import { getErrorMessage, showError } from '~/helpers/toolsHelper'
import { useInput } from '~/hooks/useInput'

const usersStore = useUsersStore()

const { value: keyword, onInput: onKeywordInput } = useInput<string>('')

const filteredUsers = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return usersStore.users

  return usersStore.users.filter(
    (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
  )
})

const emptyMessage = computed(() =>
  keyword.value.trim()
    ? 'Tidak ada pengguna yang cocok. Coba kata kunci lain.'
    : 'Belum ada pengguna terdaftar.',
)

onMounted(async () => {
  try {
    await usersStore.fetchUsers()
  } catch (error) {
    await showError(getErrorMessage(error))
  }
})
</script>

<template>
  <section class="mx-auto w-full max-w-4xl space-y-6">
    <header>
      <h1 class="text-2xl font-extrabold text-slate-900">Direktori pengguna</h1>
      <p class="mt-1 text-sm text-slate-500">Daftar semua pengguna yang terdaftar di Delcom.</p>
    </header>

    <div>
      <label for="search-users" class="sr-only">Cari pengguna</label>
      <div class="relative">
        <Search
          class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="search-users"
          type="search"
          placeholder="Cari berdasarkan nama atau email"
          :value="keyword"
          class="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          @input="onKeywordInput"
        />
      </div>
      <p class="mt-2 text-xs text-slate-500">
        {{ filteredUsers.length }} dari {{ usersStore.users.length }} pengguna
      </p>
    </div>

    <p v-if="usersStore.loading" role="status" class="py-10 text-center text-sm text-slate-500">
      Memuat pengguna...
    </p>

    <p
      v-else-if="filteredUsers.length === 0"
      class="rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500"
    >
      {{ emptyMessage }}
    </p>

    <ul v-else class="grid gap-3 sm:grid-cols-2">
      <li
        v-for="user in filteredUsers"
        :key="user.id"
        class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <UserAvatar :name="user.name" :photo="user.photo" class="h-12 w-12 text-lg" />
        <div class="min-w-0">
          <p class="truncate text-sm font-bold text-slate-900">{{ user.name }}</p>
          <p class="truncate text-sm text-slate-500">{{ user.email }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
