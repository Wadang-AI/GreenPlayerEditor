<template>
  <div class="language-switch" role="group" :aria-label="$t('header.language')">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="lang-opt"
      :class="{ active: currentLocale === opt.value }"
      :aria-pressed="currentLocale === opt.value"
      @click="changeLanguage(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { saveLanguage } from '../locales/index.js'

const { locale } = useI18n()

const currentLocale = computed(() => locale.value)

const options = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' }
]

function changeLanguage(newLocale) {
  if (newLocale === locale.value) return
  locale.value = newLocale
  saveLanguage(newLocale)
}
</script>

<style lang="less" scoped>
@import '../styles/less/variables/colors.less';
@import '../styles/less/variables/layout.less';
@import '../styles/less/variables/typography.less';
@import '../styles/less/mixins/common.less';
.language-switch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--muted) 8%, var(--panel));
  border: 1px solid var(--border);
  box-sizing: border-box;
}

.lang-opt {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  letter-spacing: 0.01em;

  &:hover {
    color: var(--text);
  }

  &.active {
    color: var(--on-accent, #fff);
    background: var(--accent);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  }
}
</style>