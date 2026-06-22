export const getLocalizedProductText = (product, language = "en") => {
  const useKhmer = language === "kh";

  return {
    title: useKhmer && product?.titleKm ? product.titleKm : product?.title || product?.name || "",
    description:
      useKhmer && product?.descriptionKm
        ? product.descriptionKm
        : product?.description || "",
  };
};

