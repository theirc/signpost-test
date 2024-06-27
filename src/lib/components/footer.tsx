import { Link } from "react-router-dom";
import { app, translate } from "../app";
import { Container } from "./container";

export function Footer() {

  const categories: { [index: number]: ZendeskCategory } = app.data.zendesk.categories;
  const sections: { [index: number]: ZendeskSection } = app.data.zendesk.sections;

  // const footerMenu: Menu[] = app.page.header.menu.filter((item: Menu) => 
  //   ["services", "language"].includes(item.type)
  // );

  const renderFooterItems = (menuItems: Menu[]) => {
    return menuItems.map((item) => {
      const title = item.title ? translate(item.title) : "";
      if (item.type === "services") {
        return (
          <a href="#service-map" key={title} className="block mb-2 text-gray-300 hover:text-white">
            {title}
          </a>
        );
      } else {
        return (
          <Link key={title} to={item.link || "#"} className="block mb-2 text-gray-300 hover:text-white">
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
        className="block mb-2 text-gray-300 hover:text-white"
      >
        {translate(category.name)}
      </Link>
    ));
  };

  const renderSections = () => {
    return Object.values(sections).map((section) => (
      <Link 
        key={section.id} 
        to={`/sections/${section.id}`} 
        className="block mb-2 text-gray-300 hover:text-white"
      >
        {translate(section.name)}
      </Link>
    ));
  };

  return (
    <Container block={app.page.footer}>
      <div className="w-full">
        <Link to="/" className="block mb-8">
          <img src={app.logo} height={30} alt="Logo" />
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* <div>
            <h3 className="text-white font-bold mb-4">Main Menu</h3>
            {renderFooterItems(footerMenu)}
          </div> */}
          <div>
            <h3 className="text-white font-bold mb-4">About</h3>
            {renderCategories()}
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Resource Center</h3>
            {renderSections()}
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Additional Links</h3>
            {app.page.footer?.footerlinks.map((link) => (
              <Link 
                key={`${link.title}-${link.url}`} 
                to={link.url} 
                className="block mb-2 text-gray-300 hover:text-white"
              >
                {translate(link.title)}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-gray-700 pt-8 text-gray-400">
          {translate(app.page.footer.text)}
        </div>
      </div>
    </Container>
  );
}