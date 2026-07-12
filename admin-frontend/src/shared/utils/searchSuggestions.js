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
      product?.title,
      product?.titleKm,
      product?.category,
      product?._id,
    ]),
    ...categories.filter((category) => category && category !== "all"),
  ]);

export const buildOrderSearchSuggestionValues = (orders = []) =>
  uniqueSearchSuggestions(
    orders.flatMap((order) => [
      order?._id,
      order?._id ? `#${String(order._id).slice(-8)}` : "",
      order?.shortId,
      order?.shortId ? `#${order.shortId}` : "",
      order?.user?.name,
      order?.user?.email,
      order?.shippingAddress?.fullName,
      order?.shippingAddress?.phone,
      order?.customerName,
      order?.customerPhone,
    ])
  );

export const buildUserSearchSuggestionValues = (users = []) =>
  uniqueSearchSuggestions(
    users.flatMap((user) => [user?.name, user?.email, user?.phone])
  );
