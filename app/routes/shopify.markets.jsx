import { authenticate } from "../shopify.server";

// The store default is the market that covers the shop's own country. If several
// markets cover it (e.g. "India" and "International"), the most specific one
// (fewest regions) wins. The detailed query needs region data; if the API
// rejects it we fall back to the plain list.
const DETAILED = `#graphql
  query Markets($after: String) {
    shop { billingAddress { countryCodeV2 } }
    markets(first: 50, after: $after) {
      nodes {
        id name handle status
        conditions {
          regionsCondition {
            regions(first: 250) {
              nodes { ... on MarketRegionCountry { code } }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }`;

const PLAIN = `#graphql
  query Markets($after: String) {
    markets(first: 50, after: $after) {
      nodes { id name handle status }
      pageInfo { hasNextPage endCursor }
    }
  }`;

async function fetchAll(admin, query) {
  let hasNextPage = true;
  let cursor = null;
  let shopCountry = null;
  const markets = [];

  while (hasNextPage) {
    const res = await admin.graphql(query, { variables: { after: cursor } });
    const data = await res.json();
    if (data?.errors?.length) throw new Error(data.errors[0].message);

    shopCountry ??= data?.data?.shop?.billingAddress?.countryCodeV2 ?? null;
    markets.push(...(data?.data?.markets?.nodes || []));
    hasNextPage = !!data?.data?.markets?.pageInfo?.hasNextPage;
    cursor = data?.data?.markets?.pageInfo?.endCursor;
  }
  return { markets, shopCountry };
}

const regionCodes = (m) =>
  (m.conditions?.regionsCondition?.regions?.nodes || [])
    .map((r) => r.code)
    .filter(Boolean);

function pickDefaultMarket(markets, shopCountry) {
  if (!shopCountry) return null;
  const candidates = markets
    .filter((m) => m.status === "ACTIVE" || !m.status)
    .map((m) => ({ m, codes: regionCodes(m) }))
    .filter(({ codes }) => codes.includes(shopCountry))
    .sort((a, b) => a.codes.length - b.codes.length);
  return candidates[0]?.m ?? null;
}

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
    let result;
    try {
      result = await fetchAll(admin, DETAILED);
    } catch (e) {
      console.warn("[shopify.markets] detailed query failed, using plain:", e.message);
      result = await fetchAll(admin, PLAIN);
    }

    const { markets, shopCountry } = result;
    const def = pickDefaultMarket(markets, shopCountry);

    return Response.json({
      // strip the heavy region lists before sending to the browser
      markets: markets.map(({ id, name, handle, status }) => ({
        id,
        name,
        handle,
        status,
      })),
      primaryMarketId: def?.id ?? null,
    });
  } catch (err) {
    // The client throws on GraphQL errors, so surface the real messages
    const gql =
      err?.body?.errors?.graphQLErrors ??
      err?.errors?.graphQLErrors ??
      err?.graphQLErrors;
    console.error("[shopify.markets] failed:", JSON.stringify(gql ?? err.message, null, 2));

    return Response.json(
      { markets: [], error: gql?.[0]?.message || err.message || "Could not load markets" },
      { status: 500 },
    );
  }
};
