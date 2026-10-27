import { getBanner } from "../utils/banner";

export default function BannerImage({ headerSettings }) {
  const banner = getBanner(headerSettings);
  if (!banner.enabled) return null;

  return (
    <div
      className="cart-plus-banner-image"
      style={{
        padding: `${banner.padding}px`,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {banner.image ? (
        <img
          src={banner.image}
          alt=""
          style={{
            display: "block",
            width: `${banner.width}%`,
            maxWidth: "100%",
            height: "auto",
            borderRadius: `${banner.radius}px`,
          }}
        />
      ) : (
        <div
          style={{
            width: `${banner.width}%`,
            aspectRatio: "700 / 200",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: `${banner.radius}px`,
            background: "rgba(0,0,0,0.04)",
            color: "#c9cccf",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6.5 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
            <path
              fillRule="evenodd"
              d="M2 5.75A2.75 2.75 0 0 1 4.75 3h10.5A2.75 2.75 0 0 1 18 5.75v8.5A2.75 2.75 0 0 1 15.25 17H4.75A2.75 2.75 0 0 1 2 14.25v-8.5Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v5.69l2.47-2.47a1.25 1.25 0 0 1 1.77 0l2.53 2.53 1.97-1.97a1.25 1.25 0 0 1 1.77 0l1.96 1.96V5.75c0-.69-.56-1.25-1.25-1.25H4.75Z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
