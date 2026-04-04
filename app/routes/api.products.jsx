import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const query = `
    {
      products(first: 10 ${cursor ? `, after: "${cursor}"` : ""}) {
        edges {
          cursor
          node {
            id
            title
            images(first: 1) {
              edges {
                node { url }
              }
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price
                  sku
                  availableForSale
                }
              }
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

  return json(data);
};