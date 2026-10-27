import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
    let hasNextPage = true;
    let cursor = null;
    const markets = [];

    while (hasNextPage) {
      const res = await admin.graphql(
        `#graphql
        query Markets($after: String) {
          markets(first: 50, after: $after) {
            nodes { id name handle status }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        { variables: { after: cursor } },
      );
      const data = await res.json();

      markets.push(...(data?.data?.markets?.nodes || []));
      hasNextPage = !!data?.data?.markets?.pageInfo?.hasNextPage;
      cursor = data?.data?.markets?.pageInfo?.endCursor;
    }

    return Response.json({ markets });
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