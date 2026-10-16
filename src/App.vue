<script setup>
import { computed, onMounted, ref } from 'vue';

const SEVERITIES = ['critical', 'high', 'medium', 'low'];

const rows = ref([]);
const generatedAt = ref(null);
const error = ref('');
const open = ref(null);
const onlyAlerts = ref(true);

onMounted(async () => {
  try {
    const res = await fetch('/alerts.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    rows.value = data.rows;
    generatedAt.value = new Date(data.generatedAt);
  } catch {
    error.value = 'alerts.json introuvable. Lance : npm run alerts';
  }
});

const count = (row, s) => row.alerts?.filter((a) => a.severity === s).length ?? 0;
const weight = (row) => SEVERITIES.reduce((n, s, i) => n + count(row, s) * 10 ** (3 - i), 0);

const sorted = computed(() =>
  rows.value
    .filter((r) => !onlyAlerts.value || r.alerts?.length || r.alerts === null)
    .sort((a, b) => weight(b) - weight(a) || a.name.localeCompare(b.name)),
);
const totals = computed(() =>
  Object.fromEntries(SEVERITIES.map((s) => [s, rows.value.reduce((n, r) => n + count(r, s), 0)])),
);
const disabled = computed(() => rows.value.filter((r) => r.alerts === null).length);
</script>

<template>
  <main>
    <h1>Alertes Dependabot</h1>

    <p class="muted">
      <template v-if="generatedAt"
        >Données du {{ generatedAt.toLocaleString('fr-FR') }} ·
      </template>
      <code>npm run alerts</code> pour actualiser
    </p>
    <p v-if="error" class="err">{{ error }}</p>

    <template v-if="rows.length">
      <section class="totals">
        <div v-for="s in SEVERITIES" :key="s" :class="['tot', s]">
          <strong>{{ totals[s] }}</strong> {{ s }}
        </div>
      </section>

      <label class="check">
        <input v-model="onlyAlerts" type="checkbox" /> Masquer les repos sans alerte
      </label>

      <table>
        <thead>
          <tr>
            <th>Repository</th>
            <th v-for="s in SEVERITIES" :key="s">{{ s }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in sorted" :key="r.name">
            <tr
              :class="{ clickable: r.alerts?.length }"
              @click="r.alerts?.length && (open = open === r.name ? null : r.name)"
            >
              <td>
                <a :href="r.url + '/security/dependabot'" target="_blank" @click.stop>{{
                  r.name
                }}</a>
              </td>
              <td v-if="r.alerts === null" colspan="4" class="muted">
                Dependabot désactivé ou inaccessible
              </td>
              <td v-else v-for="s in SEVERITIES" :key="s" :class="[s, { zero: !count(r, s) }]">
                {{ count(r, s) }}
              </td>
            </tr>
            <tr v-if="open === r.name" class="detail">
              <td colspan="5">
                <ul>
                  <li v-for="a in r.alerts" :key="a.url">
                    <span :class="['pill', a.severity]">{{ a.severity }}</span>
                    <a :href="a.url" target="_blank">{{ a.package }}</a>
                    <span class="muted">{{ a.summary }}</span>
                  </li>
                </ul>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <p v-if="disabled" class="muted">{{ disabled }} repo(s) sans Dependabot actif.</p>
    </template>
  </main>
</template>

<style>
:root {
  --bg: #fff;
  --fg: #1c2024;
  --muted: #6b7280;
  --line: #e5e7eb;
  --critical: #b42318;
  --high: #d9480f;
  --medium: #b7791f;
  --low: #2f6f9f;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14171a;
    --fg: #e8eaed;
    --muted: #9aa3ad;
    --line: #2b3036;
  }
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font:
    15px/1.5 system-ui,
    sans-serif;
}
main {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
h1 {
  font-size: 1.5rem;
  margin: 0 0 1rem;
}
.bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.bar input {
  flex: 1 1 220px;
}
input:not([type='checkbox']),
button {
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
}
button {
  cursor: pointer;
  background: var(--fg);
  color: var(--bg);
}
button:disabled {
  opacity: 0.5;
}
.err {
  color: var(--critical);
}
.totals {
  display: flex;
  gap: 1.5rem;
  margin: 1.5rem 0 1rem;
}
.tot strong {
  font-size: 1.8rem;
  display: block;
  line-height: 1.1;
}
.tot {
  text-transform: capitalize;
  color: var(--muted);
}
.check {
  display: block;
  margin-bottom: 0.75rem;
  color: var(--muted);
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--line);
  text-align: right;
}
th:first-child,
td:first-child {
  text-align: left;
}
th {
  font-weight: 500;
  color: var(--muted);
  text-transform: capitalize;
}
tr.clickable {
  cursor: pointer;
}
tr.clickable:hover {
  background: color-mix(in srgb, var(--fg) 5%, transparent);
}
a {
  color: inherit;
}
.muted {
  color: var(--muted);
  font-size: 0.9rem;
}
td.zero {
  color: var(--muted);
  opacity: 0.4;
}
td.critical,
.tot.critical strong {
  color: var(--critical);
}
td.high,
.tot.high strong {
  color: var(--high);
}
td.medium,
.tot.medium strong {
  color: var(--medium);
}
td.low,
.tot.low strong {
  color: var(--low);
}
td.zero {
  color: var(--muted);
}
.detail td {
  text-align: left;
  background: color-mix(in srgb, var(--fg) 3%, transparent);
}
.detail ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.35rem;
}
.pill {
  display: inline-block;
  min-width: 4.5rem;
  text-align: center;
  margin-right: 0.5rem;
  padding: 0 0.4rem;
  border-radius: 99px;
  font-size: 0.8rem;
  color: #fff;
}
.pill.critical {
  background: var(--critical);
}
.pill.high {
  background: var(--high);
}
.pill.medium {
  background: var(--medium);
}
.pill.low {
  background: var(--low);
}
</style>
