import express from "express";
const router = express.Router();
import { fetch } from "undici";
import multer from "multer";
import { FormData, Blob } from "formdata-node";

const upload = multer({ storage: multer.memoryStorage() });

async function stageImage(filename, mimetype, fileSize, shop, accessToken) {
  const res = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({
      query: `
        mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              url
              resourceUrl
              parameters { name value }
            }
            userErrors { field message }
          }
        }
      `,
      variables: {
        input: [
          {
            resource: "FILE",
            filename,
            mimeType: mimetype,
            fileSize: fileSize.toString(),
            httpMethod: "POST",
          },
        ],
      },
    }),
  });

  const json = await res.json();

  return json.data.stagedUploadsCreate.stagedTargets[0];
}

async function uploadToStage(stagedTarget, fileBuffer, filename) {
  const form = new FormData();

  stagedTarget.parameters.forEach((param) => {
    form.append(param.name, param.value);
  });

  form.append("file", new Blob([fileBuffer]), filename);

  const uploadRes = await fetch(stagedTarget.url, {
    method: "POST",
    body: form,
  });

  if (!uploadRes.ok) throw new Error("Failed uploading to S3");

  return stagedTarget.resourceUrl;
}

async function createShopifyFile(resourceUrl, shop, accessToken) {
  const res = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({
      query: `
        mutation fileCreate($files: [FileCreateInput!]!) {
          fileCreate(files: $files) {
            files {
              id
              fileStatus
              preview { image { url } }
            }
            userErrors { message }
          }
        }
      `,
      variables: {
        files: [
          {
            originalSource: resourceUrl,
            contentType: "IMAGE",
          },
        ],
      },
    }),
  });

  const json = await res.json();

  return json.data.fileCreate.files[0];
}

async function getFileById(id, shop, accessToken) {
  const res = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({
      query: `
        query getFile($id: ID!) {
          node(id: $id) {
            ... on MediaImage {
              image { url }
            }
          }
        }
      `,
      variables: { id },
    }),
  });

  const json = await res.json();
  return json.data.node;
}

async function waitForImageUrl(id, shop, accessToken, retries = 10) {
  for (let i = 0; i < retries; i++) {
    const file = await getFileById(id, shop, accessToken);
    if (file?.image?.url) {
      return file.image.url;
    }

    await new Promise((res) => setTimeout(res, 1200));
  }

  return null;
}

router.post("/upload-trust-badge", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { shop, accessToken } = req.body;
    if (!shop || !accessToken)
      return res.status(400).json({ error: "Missing shop or accessToken" });

    const buffer = req.file.buffer;

    const stage = await stageImage(
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      shop,
      accessToken,
    );
    const resourceUrl = await uploadToStage(
      stage,
      buffer,
      req.file.originalname,
    );
    const fileData = await createShopifyFile(resourceUrl, shop, accessToken);
    const finalUrl = await waitForImageUrl(fileData.id, shop, accessToken);

    res.json({
      success: true,
      id: fileData.id,
      imageUrl: finalUrl,
    });
  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
