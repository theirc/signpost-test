import { CSSProperties, useEffect, useRef, useState } from "react";
import { app, translate } from "../app";
import { translations } from "../../translations";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { languages } from "../locale";
import MegaMenu from './megamenu';
import LanguageDropdown from "./languagedropdown";
import MobileNavigationDrawer from './mobilenavigationdrawer';
import Container from "./menucontainer";
import { MenuOutlined } from "@ant-design/icons";

export interface MenuResources {
  title: LocalizableText
  link: string
  children: MenuResources[]
}

export function Header() {
  const styles: CSSProperties = {};
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate()
  const location = useLocation()
  const locale = languages[app.locale]?.zendesk as string ?? app.locale

  const drawerButtonRef = useRef(null);

  const menu = app.page.header.menu

  if (app.page.header.color) styles.color = app.page.header.color;
  if (app.page.header.bgcolor) styles.backgroundColor = app.page.header.bgcolor;

  const categories = Object.values(app.data.zendesk.categories);
  const aboutMenu = menu.find((item) => item.type === "about")
  const resourcesMenus = menu.filter((item) => item.type === "menu") as Menu[]

  const extractCategoryID = (link) => {
    const match = link.match(/\/categories\/(\d+)/);
    return match ? match[1] : null;
  }

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

  const createMenuResources = (menu: Menu): MenuResources => {
    const groupedByCategoryID = menu.content!.reduce((acc, item) => {
      const categoryID = extractCategoryID(item.link);
      if (categoryID) {
        if (!acc[categoryID]) {
          acc[categoryID] = [];
        }
        acc[categoryID].push(item);
      }
      return acc;
    }, {});

    const result = Object.keys(groupedByCategoryID).map(categoryID => {
      const items = groupedByCategoryID[categoryID];
      const parentItem = items.find(item => item.link === `/${locale.toLowerCase()}/categories/${categoryID}`);
      if (parentItem) {
        parentItem.children = items.filter(item => item.link !== `/${locale.toLowerCase()}/categories/${categoryID}`);
      }
      return parentItem;
    }).filter(item => item !== undefined);

    return { title: menu.title!, link: '', children: result };
  }


  const menuResourcesArray = resourcesMenus.map(createMenuResources)

  if (aboutMenu) {
    if (!aboutMenu.content) {
      aboutMenu.content = [];
    }
    categories.forEach((category) => {
      if (
        !aboutMenu.content.some(
          (item) => item.link === `/${locale.toLowerCase()}/categories/${category.id}`
        )
      ) {
        aboutMenu.content.push({
          title: category.name,
          link: `/${locale.toLowerCase()}/categories/${category.id}`,
        });
      }
    });
  }
  const renderMenuItems = (menuItems: Menu[]) => {
    return menuItems.map((item) => {
      if (item.type === 'info' || item.type === 'menu' || item.type === 'link' || item.type === 'bot') return null;
      const title = item.title ? translate(item.title) : "";
      let content;

      if (item.type === 'about') {
        content = (
          <a href="#about-section" className="text-base font-normal leading-snug no-underline">
            {title}
          </a>
        );
      } else if (item.type === "services") {
        content = (
          <button
              onClick={handleScrollToServiceMap}
              className="hover:text-black font-normal leading-snug cursor-pointer text-base bg-transparent border-none p-0"
              style={{ appearance: 'none' }}
            >
              {title}
            </button>
        );
      } else {
        content = (
          <Link to={item.link || "#"} className="text-base font-normal leading-snug no-underline">
            {title}
          </Link>
        );
      }

      return <li key={title} className="mx-2 text-base font-normal leading-snug">{content}</li>;
    });
  };

  const isRTL = languages[app.locale]?.rtl

  useEffect(() => {
    if (location.hash === "#service-map") {
      const targetElement = document.getElementById("service-map");
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.pathname, location.hash])

  return (
    <div className="flex items-center tracking-wide justify-center" style={styles}>
      <nav className={`w-full px-4 sm:px-6 py-4 md:px-8 max-w-7xl mx-auto flex ${isRTL ? "rtl" : ""}`} style={styles}>
        <div>
          <Link to="/">
            <img src={app.logo} height={40} alt="Logo" />
          </Link>
        </div>
        <Container>
          <div className="toolbar">
            <a
              href="/"
              className="material-symbols-outlined material-icons leading-snug"
              style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}
            >
              home
            </a>
            <button
              ref={drawerButtonRef}
              className="menu_icon md:hidden"
              aria-haspopup="true"
              onClick={() => setIsDrawerOpen(true)}
            >
              {/* Mobile Hamburger menu */}
              <MenuOutlined />
            </button>
            <div className="hidden md:flex items-center justify-between w-full">
              <ul className="flex list-none
               text-base font-normal leading-snug">
                {renderMenuItems(menu)}
                {menuResourcesArray.map((menuResources, index) => (
                  <li key={index} className="list-none text-base font-normal leading-snug">
                    <MegaMenu menuData={[menuResources]} />
                  </li>
                ))}
              </ul>
              <ul className="flex items-center list-none">
               {menu.find(x => x.type === 'bot') && <li className="mr-2">
                  <Link to="/signpostbot" className="text-base font-normal leading-snug no-underline">Bot</Link>
                </li>}
                <li className="mr-2 ">
                  <Link to='/search-results' className="text-base font-normal leading-snug no-underline">{translate(translations.search)}</Link>
                </li>
                <li>
                  <LanguageDropdown isMobile={false} />
                </li>
              </ul>
            </div>
            {/* Mobile navigation drawer */}
            <div className="md:hidden absolute">
              <MobileNavigationDrawer
                menuDataArray={menuResourcesArray} {...{ isDrawerOpen, setIsDrawerOpen, drawerButtonRef }}
              />
              {isDrawerOpen && (
                <div className="p-4">
                  <LanguageDropdown isMobile={true} />
                </div>
              )}
            </div>
          </div>
        </Container>
      </nav>
    </div>
  );
}