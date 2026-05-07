import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {

    const { admin } = await authenticate.admin(request);

    let hasNextPage = true;
    let cursor = null;
    let allCollections = [];

    while (hasNextPage) {
        const query = `
      {
        collections(first: 50 ${cursor ? `, after: "${cursor}"` : ""}) {
          edges {
            cursor
            node {
              id
              title
              handle
              image {
                url
              }
              productsCount {
                count
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

        const res = await admin.graphql(query);
        const data = await res.json();

        const edges = data?.data?.collections?.edges || [];

        allCollections.push(...edges);

        hasNextPage = data?.data?.collections?.pageInfo?.hasNextPage;

        cursor = edges[edges.length - 1]?.cursor;
    }

    return json({
        collections: allCollections,
    });
};