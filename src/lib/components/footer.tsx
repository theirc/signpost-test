import { Link } from "react-router-dom";
import { app, translate } from "../app";
import { Container } from "./container";

export function Footer() {

  const categories: { [index: number]: ZendeskCategory } = app.data.zendesk.categories;

  const footerMenu: Menu[] = app.page.header.menu.filter((item: Menu) => 
    ["services", "language"].includes(item.type)
  );

  const renderFooterItems = (menuItems: Menu[]) => {
    return menuItems.map((item) => {
      const title = item.title ? translate(item.title) : "";
      if (item.type === "services") {
        return (
          <a href="#service-map" key={title} className="text-white hover:text-gray-800 mr-8 mb-5">
            {title}
          </a>
        );
      } else {
        return (
          <Link key={title} to={item.link || "#"} className="text-white hover:text-gray-800 mr-8 mb-5">
            {title}
          </Link>
        );
      }
    });
  };

  const renderCategories = () => {
    return Object.values(categories).map((category) => (
      <Link 
        key={category.id} 
        to={`/categories/${category.id}`} 
        className="text-white hover:text-gray-800 mr-8 mb-5"
      >
        {translate(category.name)}
      </Link>
    ));
  };

  return (
    <footer className="border-t border-gray-200 py-4">
    <Container block={app.page.footer}>
      <div className="flex flex-col md:flex-row md:items-center mb-4">
        <Link to="/" className="mb-14 pr-10 md:mb-0 md:mr-20">
          <img src={app.logo} height={30} alt="Logo" />
        </Link>
        <div className="flex flex-col md:flex-row md:flex-wrap">
          <Link to="/" className="text-white mr-8 mb-5">Home</Link>
          {renderCategories()}
          {renderFooterItems(footerMenu)}
          </div>
        </div>
        <div className="flex flex-wrap mt-8">
            {app.page.footer?.footerlinks.map((link) => (
              <Link 
                key={`${link.title}-${link.url}`} 
                to={link.url} 
                className="mr-4 mb-4 text-white"
              >
                {translate(link.title)}
              </Link>
            ))}
          </div>
          <div className="text-white">
            {translate(app.page.footer.text)}
          </div>
    </Container>
    </footer>
  );
}