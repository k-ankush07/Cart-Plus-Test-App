export const getCart = async (apiUrl, cartId) => {
  const res = await fetch(`${apiUrl}/api/get-cart/${cartId}`, {
    credentials: "include",
  });
  return res.json();
};



export const updateCart = async (apiUrl, cartId, data) => {
  return fetch(`${apiUrl}/api/update-cart/${cartId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const getCarts = async (apiUrl, shop) => {
  const res = await fetch(`${apiUrl}/api/get-carts?shop=${shop}`, {
    method: "GET",
    credentials: "include",
  });

  return res.json();
};

export const deleteCart = async (apiUrl, cartId) => {
  const res = await fetch(`${apiUrl}/api/delete-cart`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cartId }),
  });

  return res.json();
};

export const uploadImage = async (apiUrl, file, shop, accessToken) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("shop", shop.myshopifyDomain);
  formData.append("accessToken", accessToken);

    console.log(accessToken, shop, apiUrl)

  const res = await fetch(`${apiUrl}/api/upload-image`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return res.json();
};

export const togglePublishCart = async (apiUrl, cartId) => {
  const res = await fetch(`${apiUrl}/api/toggle-publish`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cartId }),
  });

  return res.json();
};

export const renameCart = async (apiUrl, cartId, cartName) => {
  const res = await fetch(`${apiUrl}/api/update-cart/${cartId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartName }),
  });
  return res.json();
};

export const duplicateCart = async (apiUrl, cartId) => {
  const res = await fetch(`${apiUrl}/api/duplicate-cart`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cartId }),
  });

  return res.json();
};

export const createStickyCart = async (apiUrl, data) => {
  const res = await fetch(`${apiUrl}/api/save-sticky-cart`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getStickyCart = async (apiUrl, shop) => {
  const res = await fetch(`${apiUrl}/api/get-sticky-cart/${shop}`, {
    method: "GET",
    credentials: "include",
  });
  return res.json();
};
