const normalizeSuggestion = (value) => String(value || "").trim();

export const uniqueSearchSuggestions = (values = []) => {
  const seen = new Set();
  const suggestions = [];

  values.forEach((value) => {
    const suggestion = normalizeSuggestion(value);
    const key = suggestion.toLowerCase();

    if (!suggestion || seen.has(key)) return;

    seen.add(key);
    suggestions.push(suggestion);
  });

  return suggestions;
};

export const getMatchingSearchSuggestions = (values = [], query = "", limit = 8) => {
  const normalizedQuery = normalizeSuggestion(query).toLowerCase();
  const suggestions = uniqueSearchSuggestions(values);
  const matches = normalizedQuery
    ? suggestions.filter((suggestion) => suggestion.toLowerCase().includes(normalizedQuery))
    : suggestions;

  return matches
    .sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aStarts = normalizedQuery && aLower.startsWith(normalizedQuery);
      const bStarts = normalizedQuery && bLower.startsWith(normalizedQuery);

      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return a.localeCompare(b);
    })
    .slice(0, limit);
};

export const buildProductSearchSuggestionValues = (products = [], categories = []) =>
  uniqueSearchSuggestions([
    ...products.flatMap((product) => [
      product?.name,
      product?.title,
      product?.titleKm,
      product?.category,
    ]),
    ...categories.filter((category) => category && category !== "All"),
  ]);
