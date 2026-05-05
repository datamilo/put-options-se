import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './en/common.json';
import enPages from './en/pages.json';
import enTables from './en/tables.json';
import enCharts from './en/charts.json';
import enTooltips from './en/tooltips.json';

import svCommon from './sv/common.json';
import svPages from './sv/pages.json';
import svTables from './sv/tables.json';
import svCharts from './sv/charts.json';
import svTooltips from './sv/tooltips.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        pages: enPages,
        tables: enTables,
        charts: enCharts,
        tooltips: enTooltips,
      },
      sv: {
        common: svCommon,
        pages: svPages,
        tables: svTables,
        charts: svCharts,
        tooltips: svTooltips,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
