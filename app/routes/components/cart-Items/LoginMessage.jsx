import { getLogin } from "../utils/loginMessage";

// Preview of the "Have an account? Log in ..." line above the checkout button
export default function LoginMessage({ cartSettings }) {
  const s = getLogin(cartSettings);
  if (!s.enabled) return null;

  const part = (html) => <span dangerouslySetInnerHTML={{ __html: html }} />;

  return (
    <div
      className="cart-plus-login-message"
      style={{
        textAlign: s.alignment,
        paddingTop: s.top,
        paddingBottom: s.bottom,
        paddingInline: 16,
        fontSize: 15,
      }}
    >
      {part(s.beforeLink)}{" "}
      <a
        href="/account/login"
        onClick={(e) => e.preventDefault()}
        style={{ color: "inherit" }}
      >
        {part(s.linkText)}
      </a>{" "}
      {part(s.afterLink)}
    </div>
  );
}
