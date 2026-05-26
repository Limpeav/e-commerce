import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../../context/useLanguage";
import { staticTextTranslations } from "../../i18n/translations";

const textNodeOriginals = new WeakMap();
const ATTRIBUTE_NAMES = ["placeholder", "aria-label", "title"];

const normalizeText = (value = "") => value.replace(/\s+/g, " ").trim();
const hasDigit = (value = "") => /\d/.test(value);

const translateTextNode = (node, dictionary, language) => {
  if (hasDigit(node.nodeValue)) return;

  if (!textNodeOriginals.has(node)) {
    textNodeOriginals.set(node, node.nodeValue);
  }

  const original = textNodeOriginals.get(node);
  const normalizedOriginal = normalizeText(original);

  if (!normalizedOriginal) return;

  if (language === "km") {
    const translated = dictionary[normalizedOriginal];
    if (!translated) return;

    const nextValue = original.replace(normalizedOriginal, translated);
    if (node.nodeValue !== nextValue) {
      node.nodeValue = nextValue;
    }
    return;
  }

  if (node.nodeValue !== original) {
    node.nodeValue = original;
  }
};

const translateAttributes = (element, dictionary, language) => {
  ATTRIBUTE_NAMES.forEach((name) => {
    const currentValue = element.getAttribute(name);
    if (!currentValue) return;

    const originalKey = `data-original-${name}`;
    const originalValue = element.getAttribute(originalKey) || currentValue;

    if (!element.hasAttribute(originalKey)) {
      element.setAttribute(originalKey, originalValue);
    }

    const normalizedOriginal = normalizeText(originalValue);

    if (language === "km") {
      const translated = dictionary[normalizedOriginal];
      if (translated) {
        const nextValue = originalValue.replace(normalizedOriginal, translated);
        if (element.getAttribute(name) !== nextValue) {
          element.setAttribute(name, nextValue);
        }
      }
      return;
    }

    if (element.getAttribute(name) !== originalValue) {
      element.setAttribute(name, originalValue);
    }
  });
};

const translateTree = (root, dictionary, language) => {
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
    translateTextNode(currentNode, dictionary, language);
    currentNode = walker.nextNode();
  }

  root.querySelectorAll?.("[placeholder], [aria-label], [title]").forEach((element) => {
    translateAttributes(element, dictionary, language);
  });
};

export default function StaticTextTranslator({ disabled = false }) {
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (disabled || language !== "km") return undefined;

    const dictionary = staticTextTranslations.km || {};
    const runTranslation = () => translateTree(document.body, dictionary, language);

    runTranslation();

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(runTranslation);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTE_NAMES,
    });

    return () => observer.disconnect();
  }, [disabled, language, location.pathname, location.search]);

  return null;
}
