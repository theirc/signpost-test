import { Link, useLocation, useNavigate } from "react-router-dom";
import { translations } from "../../translations";
import { app, translate } from "../app";
import { Container } from "./container";
import { languages } from "../locale";
import { useEffect } from "react";

export function Footer() {
  const navigate = useNavigate()
  const location = useLocation()
  const categories: { [index: number]: ZendeskCategory } = app.data.zendesk.categories;
  const isRTL = languages[app.locale]?.rtl;


  const footerMenu: Menu[] = app.page.header.menu.filter((item: Menu) =>
    ["services"].includes(item.type)
  );

  const handleScrollToServiceMap = () => {
    if (location.pathname !== "/") {
      navigate("/#service-map", { replace: false })
    } else {
      const targetElement = document.getElementById("service-map")
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  const renderFooterItems = (menuItems: Menu[]) => {
    return menuItems.map((item) => {
      const title = item.title ? translate(item.title) : "";
      if (item.type === "services") {
        return (
          <li key={title} className={`mb-3 sm:mb-0 ${isRTL ? 'sm:ml-6' : 'sm:mr-6'}`}>
            <button
              onClick={handleScrollToServiceMap}
              className="hover:text-gray-500 text-sm font-medium leading-snug cursor-pointer text-black bg-transparent border-none p-0"
              style={{ appearance: 'none' }}
            >
              {title}
            </button>
          </li>
        )
      } else {
        return (
          <li key={title} className={`mb-3 sm:mb-0 ${isRTL ? 'sm:ml-6' : 'sm:mr-6'} text-sm`}>
            <Link to={item.link || "#"} className="hover:text-gray-800 text-sm font-light leading-snug">
              {title}
            </Link>
          </li>
        );
      }
    });
  };


  const renderCategories = () => {
    return Object.values(categories).map((category) => (
      <li key={category.id} className={`mb-3 sm:mb-0 ${isRTL ? 'sm:ml-6' : 'sm:mr-6'}`}>
        <Link to={`/categories/${category.id}`} className="hover:text-gray-800 text-sm font-medium leading-snug">
          {translate(category.name)}
        </Link>
      </li>
    ));
  };

  useEffect(() => {
    if (location.hash === "#service-map") {
      const targetElement = document.getElementById("service-map");
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.pathname, location.hash])

  return (
    <footer className={`footer-black-text ${isRTL ? 'rtl' : ''}`}>
      <Container block={app.page.footer}>
        <div className="flex flex-col space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="mb-6 sm:mb-0">
              <img src={app.logo} alt="Logo" className="h-10 mb-2" />
            </Link>
            <ul className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 list-none">
              <li className="mb-3 sm:mb-0 sm:mr-6">
                <Link to="/" className="hover:text-gray-800 text-sm font-medium leading-snug">
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
                  className="hover:text-gray-800 text-base font-normal leading-normal"
                >
                  {translate(link.title)}
                </Link>
              </li>
            ))}
          </ul>
          <p className={`text-base font-normal leading-snug ${isRTL ? 'text-right' : ''}`}>
            {translate(app.page.footer.text)}
          </p>
        </div>
      </Container>
    </footer>
  );
}