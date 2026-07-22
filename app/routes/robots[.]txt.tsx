export const loader = async () => {
  return new Response("User-agent: *\nDisallow: /", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};