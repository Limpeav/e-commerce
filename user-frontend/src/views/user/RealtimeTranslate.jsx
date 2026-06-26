import { useCallback, useEffect, useMemo, useState } from "react";
import { Languages, Loader2, RotateCcw } from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";
import ContentBox from "../../components/ui/ContentBox";
import { useLanguage } from "../../context/useLanguage";
import { translateTextRealtime } from "../../services/realtime";

const languages = [
  { value: "auto", label: "Auto detect" },
  { value: "en", label: "English" },
  { value: "km", label: "Khmer" },
];

const targetLanguages = languages.filter((language) => language.value !== "auto");

export default function RealtimeTranslate() {
  const { language } = useLanguage();
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState(language === "kh" ? "en" : "km");
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canTranslate = useMemo(() => sourceText.trim().length > 0, [sourceText]);

  const translate = useCallback(async (text = sourceText) => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      setTranslatedText("");
      setErrorMessage("");
      return;
    }

    setIsTranslating(true);
    setErrorMessage("");

    try {
      const result = await translateTextRealtime({
        text: trimmedText,
        sourceLanguage,
        targetLanguage,
      });
      setTranslatedText(result.translatedText);
    } catch (error) {
      setTranslatedText("");
      setErrorMessage(error.message || "Translation failed");
    } finally {
      setIsTranslating(false);
    }
  }, [sourceLanguage, sourceText, targetLanguage]);

  useEffect(() => {
    if (!canTranslate) {
      setTranslatedText("");
      setErrorMessage("");
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      translate(sourceText);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [canTranslate, sourceText, sourceLanguage, targetLanguage, translate]);

  const swapLanguages = () => {
    const nextSourceLanguage = targetLanguage;
    const nextTargetLanguage =
      sourceLanguage === "auto" ? (targetLanguage === "km" ? "en" : "km") : sourceLanguage;

    setSourceLanguage(nextSourceLanguage);
    setTargetLanguage(nextTargetLanguage);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  return (
    <PageLayout
      title="Live Translate"
      subtitle="Translate text through the realtime socket connection."
      badge="Socket"
      icon={Languages}
      badgeColor="primary"
      maxWidth="5xl"
      seoTitle="Live Translate"
      seoDescription="Realtime socket translation"
      canonical="/translate"
    >
      <ContentBox padding="p-4 sm:p-6 lg:p-8" rounded="rounded-2xl">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-start">
          <div className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">
                Source
              </label>
              <select
                value={sourceLanguage}
                onChange={(event) => setSourceLanguage(event.target.value)}
                className="rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-3 py-2 text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20"
              >
                {languages.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              data-no-static-translation
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              maxLength={5000}
              rows={10}
              className="min-h-64 w-full resize-y rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium leading-6 text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
              placeholder="Type text to translate..."
            />
            <p className="text-right text-[11px] font-bold text-text-muted">
              {sourceText.length}/5000
            </p>
          </div>

          <div className="flex justify-center lg:pt-11">
            <button
              type="button"
              onClick={swapLanguages}
              disabled={!sourceText && !translatedText}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-100 bg-bg-card text-primary shadow-sm transition hover:border-primary hover:bg-primary hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Swap languages"
              title="Swap languages"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">
                Target
              </label>
              <select
                value={targetLanguage}
                onChange={(event) => setTargetLanguage(event.target.value)}
                className="rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-3 py-2 text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20"
              >
                {targetLanguages.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div
              data-no-static-translation
              className="min-h-64 rounded-xl border border-stone-100 bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm font-medium leading-6 text-text-main"
            >
              {isTranslating ? (
                <span className="inline-flex items-center gap-2 text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Translating...
                </span>
              ) : (
                translatedText || <span className="text-text-muted">Translation appears here</span>
              )}
            </div>
            {errorMessage && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </ContentBox>
    </PageLayout>
  );
}
