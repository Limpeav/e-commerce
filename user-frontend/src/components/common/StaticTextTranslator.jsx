import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../../context/useLanguage";
import { staticTextTranslations, translations } from "../../i18n/translations";

const textNodeOriginals = new WeakMap();
const ATTRIBUTE_NAMES = ["placeholder", "aria-label", "title"];

const normalizeText = (value = "") => value.replace(/\s+/g, " ").trim();
const hasDigit = (value = "") => /\d/.test(value);
const hasInterpolation = (value = "") => /\{\{.+?\}\}/.test(value);
const collectStructuredTranslations = (englishNode, khmerNode, dictionary = {}) => {
  if (typeof englishNode === "string" && typeof khmerNode === "string") {
    const englishText = normalizeText(englishNode);
    const khmerText = normalizeText(khmerNode);

    if (englishText && khmerText && !hasInterpolation(englishText) && !hasInterpolation(khmerText)) {
      dictionary[englishText] = khmerText;
    }

    return dictionary;
  }

  if (!englishNode || !khmerNode || typeof englishNode !== "object" || typeof khmerNode !== "object") {
    return dictionary;
  }

  Object.keys(englishNode).forEach((key) => {
    collectStructuredTranslations(englishNode[key], khmerNode[key], dictionary);
  });

  return dictionary;
};
const buildTranslationDictionary = () => ({
  ...collectStructuredTranslations(translations.en, translations.kh),
  ...(staticTextTranslations.kh || {}),
});
const buildReverseDictionary = (dictionary) =>
  Object.entries(dictionary).reduce((reverseDictionary, [englishText, khmerText]) => {
    reverseDictionary[normalizeText(khmerText)] = englishText;
    return reverseDictionary;
  }, {});

const getEnglishOriginal = (value, reverseDictionary) => {
  const normalizedValue = normalizeText(value);
  return reverseDictionary[normalizedValue] || value;
};

const translateTextNode = (node, dictionary, reverseDictionary, language) => {
  if (node.parentElement?.closest("[data-no-static-translation]")) return;
  if (hasDigit(node.nodeValue)) return;

  if (!textNodeOriginals.has(node)) {
    textNodeOriginals.set(node, getEnglishOriginal(node.nodeValue, reverseDictionary));
  }

  const original = getEnglishOriginal(textNodeOriginals.get(node), reverseDictionary);
  const normalizedOriginal = normalizeText(original);

  if (!normalizedOriginal) return;

  if (language === "kh") {
    const translated = dictionary[normalizedOriginal];
    if (!translated) return;

    const nextValue = original.replace(normalizedOriginal, translated);
    if (node.nodeValue !== nextValue) {
      node.nodeValue = nextValue;
    }
    return;
  }

  const englishValue = original.replace(
    normalizedOriginal,
    reverseDictionary[normalizeText(node.nodeValue)] || normalizedOriginal
  );

  if (node.nodeValue !== englishValue) {
    node.nodeValue = englishValue;
  }
};

const translateAttributes = (element, dictionary, reverseDictionary, language) => {
  if (element.closest("[data-no-static-translation]")) return;

  ATTRIBUTE_NAMES.forEach((name) => {
    const currentValue = element.getAttribute(name);
    if (!currentValue) return;

    const originalKey = `data-original-${name}`;
    const originalValue = getEnglishOriginal(
      element.getAttribute(originalKey) || currentValue,
      reverseDictionary
    );

    if (!element.hasAttribute(originalKey)) {
      element.setAttribute(originalKey, originalValue);
    } else if (element.getAttribute(originalKey) !== originalValue) {
      element.setAttribute(originalKey, originalValue);
    }

    const normalizedOriginal = normalizeText(originalValue);

    if (language === "kh") {
      const translated = dictionary[normalizedOriginal];
      if (translated) {
        const nextValue = originalValue.replace(normalizedOriginal, translated);
        if (element.getAttribute(name) !== nextValue) {
          element.setAttribute(name, nextValue);
        }
      }
      return;
    }

    const englishValue = originalValue.replace(
      normalizedOriginal,
      reverseDictionary[normalizeText(currentValue)] || normalizedOriginal
    );

    if (element.getAttribute(name) !== englishValue) {
      element.setAttribute(name, englishValue);
    }
  });
};

const translateTree = (root, dictionary, reverseDictionary, language) => {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let currentNode = walker.nextNode();
  while (currentNode) {
    translateTextNode(currentNode, dictionary, reverseDictionary, language);
    currentNode = walker.nextNode();
  }

  root.querySelectorAll?.("[placeholder], [aria-label], [title]").forEach((element) => {
    translateAttributes(element, dictionary, reverseDictionary, language);
  });
};

export default function StaticTextTranslator({ disabled = false }) {
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (disabled || !["en", "kh"].includes(language)) return undefined;

    const dictionary = buildTranslationDictionary();
    const reverseDictionary = buildReverseDictionary(dictionary);
    let animationFrame = 0;

    const runTranslation = () => {
      animationFrame = 0;
      translateTree(document.body, dictionary, reverseDictionary, language);
    };

    const scheduleTranslation = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(runTranslation);
    };

    runTranslation();
    window.setTimeout(scheduleTranslation, 0);
    window.setTimeout(scheduleTranslation, 120);

    const observer = new MutationObserver(scheduleTranslation);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTE_NAMES,
    });

    return () => {
      observer.disconnect();
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [disabled, language, location.pathname, location.search]);

  return null;
}
