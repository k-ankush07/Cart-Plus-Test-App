export function normalizeShopDomain(shop) {
  if (!shop) return "";

  shop = String(shop).trim().toLowerCase();

  if (shop.endsWith(".myshopify.com")) {
    return shop;
  }

  const firstPart = shop.split(".")[0];
  return `${firstPart}.myshopify.com`;
}