import { sales } from "../data/sales";

export async function getTopSellers(limit: number = 5) {
  const sellers = [...sales]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  return {
    sellers
  };
}