import { Link } from "react-router-dom";
import { translations } from "../../translations";
import { app, translate } from "../app";
import { Container } from "./container";

export function Footer() {

  const categories: { [index: number]: ZendeskCategory } = app.data.zendesk.categories;

  const footerMenu: Menu[] = app.page.header.menu.filter((item: Menu) => 
    ["services"].includes(item.type)
  );

  const renderFooterItems = (menuItems: Menu[]) => {
    return menuItems.map((item) => {
      const title = item.title ? translate(item.title) : "";
      if (item.type === "services") {
        return (
          <li key={title} className="mb-3 sm:mb-0 sm:mr-6">
            <a href="#service-map" className="hover:text-gray-800">
              {title}
            </a>
          </li>
        );
      } else {
        return (
          <li key={title} className="mb-3 sm:mb-0 sm:mr-6">
            <Link to={item.link || "#"} className="hover:text-gray-800">
              {title}
            </Link>
          </li>
        );
      }
    });
  };


  const renderCategories = () => {
    return Object.values(categories).map((category) => (
      <li key={category.id} className="mb-3 sm:mb-0 sm:mr-6">
      <Link to={`/categories/${category.id}`} className="hover:text-gray-800">
        {translate(category.name)}
      </Link>
    </li>
  ));
};

  return (
    <footer className="footer-black-text py-4">
      <Container block={app.page.footer}>
        <div className="flex flex-col space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="mb-6 sm:mb-0">
              <img src={app.logo} alt="Logo" className="h-10 mb-2" />
            </Link>
            <ul className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 list-none">
              <li className="mb-3 sm:mb-0 sm:mr-6">
                <Link to="/" className="hover:text-gray-800">
                  {translate(translations.home)}
                </Link>
              </li>
              {renderCategories()}
              {renderFooterItems(footerMenu)}
            </ul>
          </div>
          <ul className="flex flex-wrap list-none">
            {app.page.footer?.footerlinks.map((link) => (
              <li key={`${link.title}-${link.url}`} className="mr-4 mb-3">
                <Link 
                  to={link.url} 
                  className="hover:text-gray-800"
                >
                  {translate(link.title)}
                </Link>
              </li>
            ))}
          </ul>
          <div>
            {translate(app.page.footer.text)}
          </div>
        </div>
      </Container>
    </footer>
  );
}