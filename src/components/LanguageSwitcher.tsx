import { useLanguage } from "../lib/LanguageContext";
import type { Language } from "../lib/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      <button
        className={`language-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
        title="English"
      >
        EN
      </button>
      <button
        className={`language-btn ${language === 'zh' ? 'active' : ''}`}
        onClick={() => setLanguage('zh')}
        title="中文"
      >
        中
      </button>
    </div>
  );
}
