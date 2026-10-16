<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface Alert {
  url: string;
  severity: Severity;
  package: string;
  summary: string;
}

interface Row {
  name: string;
  url: string;
  alerts: Alert[] | null; // null = Dependabot désactivé ou inaccessible
}

interface AlertsFile {
  generatedAt: string;
  rows: Row[];
}

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

const rows = ref<Row[]>([]);
const generatedAt = ref<Date>();
const error = ref('');
const open = ref<string | null>(null);
const onlyAlerts = ref(true);

onMounted(async () => {
  try {
    const res = await fetch('/alerts.json');
    if (!res.ok) throw new Error();
    const data: AlertsFile = await res.json();
    rows.value = data.rows;
    generatedAt.value = new Date(data.generatedAt);
  } catch {
    error.value = 'alerts.json introuvable. Lance : npm run alerts';
  }
});

const count = (row: Row, s: Severity) => row.alerts?.filter((a) => a.severity === s).length ?? 0;
const weight = (row: Row) => SEVERITIES.reduce((n, s, i) => n + count(row, s) * 10 ** (3 - i), 0);

const sorted = computed(() =>
  rows.value
    .filter((r) => !onlyAlerts.value || r.alerts?.length || r.alerts === null)
    .sort((a, b) => weight(b) - weight(a) || a.name.localeCompare(b.name)),
);
const totals = computed(
  () =>
    Object.fromEntries(
      SEVERITIES.map((s) => [s, rows.value.reduce((n, r) => n + count(r, s), 0)]),
    ) as Record<Severity, number>,
);
const disabled = computed(() => rows.value.filter((r) => r.alerts === null).length);
</script>

<template>
  <main class="max-w-3xl mx-auto py-6 px-4 flex flex-col gap-4">
    <h1 class="text-3xl font-bold">Alertes Dependabot</h1>

    <p class="muted">
      <template v-if="generatedAt">
        Données du {{ generatedAt.toLocaleString('fr-FR') }} ·
      </template>
      <code>npm run alerts</code> pour actualiser
    </p>
    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <template v-if="rows.length">
      <div class="stats shadow-lg bg-base-100">
        <div class="stat place-items-center" v-for="s in SEVERITIES" :key="s">
          <div class="stat-value" :class="[`text-${s}`, s]">{{ totals[s] }}</div>
          <div class="stat-title uppercase">{{ s }}</div>
        </div>
      </div>

      <label class="flex gap-2 items-center">
        <input type="checkbox" class="toggle toggle-primary" v-model="onlyAlerts" /> Masquer les
        repositories sans alerte
      </label>

      <div class="overflow-x-auto rounded-box bg-base-100 shadow-lg">
        <table class="table table-border">
          <thead>
            <tr>
              <th>Repository</th>
              <th v-for="s in SEVERITIES" :key="s" class="text-center uppercase">{{ s }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="r in sorted" :key="r.name">
              <tr
                :class="{ 'hover:bg-base-200 cursor-pointer': r.alerts?.length }"
                @click="r.alerts?.length && (open = open === r.name ? null : r.name)"
              >
                <td>
                  <a
                    :href="r.url + '/security/dependabot'"
                    target="_blank"
                    class="underline underline-offset-2"
                    @click.stop
                  >
                    {{ r.name }}
                  </a>
                </td>
                <td v-if="r.alerts === null" colspan="4" class="text-base-content/40 text-center">
                  Dependabot désactivé ou inaccessible
                </td>
                <td
                  v-else
                  v-for="s in SEVERITIES"
                  :key="s"
                  :class="[`text-${s} text-center`, { 'text-base-content/40!': !count(r, s) }]"
                >
                  {{ count(r, s) }}
                </td>
              </tr>
              <tr v-if="open === r.name">
                <td colspan="5">
                  <ul>
                    <li v-for="a in r.alerts" :key="a.url" class="flex gap-x-2 items-center">
                      <span
                        :class="[
                          'badge badge-xs uppercase font-semibold w-5',
                          `bg-${a.severity} text-${a.severity}-content`,
                        ]"
                      >
                        {{ a.severity[0] }}
                      </span>
                      <a
                        :href="a.url"
                        target="_blank"
                        class="underline font-semibold whitespace-nowrap"
                      >
                        {{ a.package }}
                      </a>
                      <span class="grow text-base-content/60 line-clamp-1">{{ a.summary }}</span>
                    </li>
                  </ul>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <p v-if="disabled" class="text-base-content/40">
        {{ disabled }} repositories sans Dependabot actif.
      </p>
    </template>
  </main>
</template>
