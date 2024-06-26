import { Link } from "react-router-dom";
import { app, translate } from "../app";
import { Container } from "./container";

export function Footer() {
  return (
    <Container block={app.page.footer}>
      <div className="w-full flex flex-col">

      <Link to="/" className="mb-20">
        <img src={app.logo} height={30} alt="Logo"/>
      </Link>

      <div className=" mb-5 flex flex-wrap">
     {app.page.footer?.footerlinks.map((link) => {
          return (
            <Link key={`${link.title}-${link.url}`} to={link.url} className="items-start mr-4 text-white">
              {translate(link.title)}
            </Link>
          );
        })}
      </div>
    
      <div className="mb-5">{translate(app.page.footer.text)}</div>
   
      </div>
    </Container>
  );
}
