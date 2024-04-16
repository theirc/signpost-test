import { Link } from "react-router-dom";
import { app, translate } from "../app";
import { Container } from "./container";

export function Footer() {
  return (
    <Container block={app.page.footer}>
      <div className="mb-16">{translate(app.page.footer.text)}</div>
      <div className="mb-16">
        {app.page.footer?.footerlinks.map((link) => {
          return (
            <Link key={`${link.title}-${link.url}`} to={link.url} className="mx-1">
              {translate(link.title)}
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
