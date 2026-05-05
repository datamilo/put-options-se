import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation('common');
  const currentLang = i18n.language?.startsWith('sv') ? 'sv' : 'en';

  const toggle = () => {
    i18n.changeLanguage(currentLang === 'en' ? 'sv' : 'en');
  };

  return (
    <Button
      onClick={toggle}
      variant="ghost"
      size="sm"
      className="font-mono text-xs px-2 h-9 tracking-wide"
      title={t('language.switchLanguage')}
    >
      <span className={currentLang === 'en' ? 'font-bold' : 'opacity-40'}>
        {t('language.en')}
      </span>
      <span className="mx-1 opacity-30">|</span>
      <span className={currentLang === 'sv' ? 'font-bold' : 'opacity-40'}>
        {t('language.sv')}
      </span>
    </Button>
  );
};
