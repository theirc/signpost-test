import { CSSProperties, useRef, useState } from "react";
import { app, translate } from "../app";
import { translations } from "../../translations";
import { Link } from "react-router-dom";
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

  const drawerButtonRef = useRef(null);

  if (app.page.header.color) styles.color = app.page.header.color;
  if (app.page.header.bgcolor) styles.backgroundColor = app.page.header.bgcolor;

  const categories = Object.values(app.data.zendesk.categories);
  const aboutMenu = app.page.header.menu.find((item) => item.type === "about");
  const resourcesMenu = app.page.header.menu.find((item) => item.type === "menu")

  const extractCategoryID = (link) => {
    const match = link.match(/\/categories\/(\d+)/);
    return match ? match[1] : null;
  }

  const groupedByCategoryID = resourcesMenu.content.reduce((acc, item) => {
    const categoryID = extractCategoryID(item.link);
    if (categoryID) {
      if (!acc[categoryID]) {
        acc[categoryID] = [];
      }
      acc[categoryID].push(item);
    }
    return acc;
  }, {})

  const result = Object.keys(groupedByCategoryID).map(categoryID => {
    const items = groupedByCategoryID[categoryID];
    const parentItem = items.find(item => item.link === `/categories/${categoryID}`);
    if (parentItem) {
      parentItem.children = items.filter(item => item.link !== `/categories/${categoryID}`);
    }
    return parentItem;
  }).filter(item => item !== undefined)


  let menuResources: MenuResources[] = [{ title: resourcesMenu.title, link: '', children: result }]

  if (aboutMenu) {
    if (!aboutMenu.content) {
      aboutMenu.content = [];
    }
    categories.forEach((category) => {
      if (
        !aboutMenu.content.some(
          (item) => item.link === `/categories/${category.id}`
        )
      ) {
        aboutMenu.content.push({
          title: category.name,
          link: `/categories/${category.id}`,
        });
      }
    });
  }
  const renderMenuItems = (menuItems: Menu[]) => {
    return menuItems.map((item) => {
      if (item.type === 'info' || item.type === 'menu' || item.type === 'link') return null;
      const title = item.title ? translate(item.title) : "";
      let content;

      if (item.type === 'about') {
        content = (
          <a href="#about-section" className="text-black font-bold no-underline">
            {title}
          </a>
        );
      } else if (item.type === "services") {
        content = (
          <a href="#service-map" className="text-black font-bold no-underline">
            {title}
          </a>
        );
      } else {
        content = (
          <Link to={item.link || "#"} className="text-black font-bold no-underline">
            {title}
          </Link>
        );
      }

      return <li key={title} className="mx-2">{content}</li>;
    });
  };

  return (
    <div className="flex items-center justify-between tracking-wide justify-center" style={styles}>
      <nav className="sm:w-full px-8 lg:w-4/5 w-screen py-4 flex" style={styles}>
        <div>
          <Link to="/">
            <img src={app.logo} height={40} alt="Logo" />
          </Link>
        </div>
        <Container>
          <div className="toolbar">
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
              <ul className="flex list-none">
                {renderMenuItems(app.page.header.menu)}
                <li><MegaMenu menuData={menuResources} /></li>
              </ul>
              {/* Mobile navigation drawer */}
              <div className="md:hidden absolute">
                <MobileNavigationDrawer
                  menuData={menuResources} {...{ isDrawerOpen, setIsDrawerOpen, drawerButtonRef }}
                />
                {isDrawerOpen && (
                  <div className="p-4">
                    <LanguageDropdown isMobile={true} />
                  </div>
                )}
              </div>
              <ul className="flex items-center list-none">
                <li className="mr-2">
                  <Link to="/signpostbot" className="text-black font-bold no-underline">Bot</Link>
                </li>
                <li className="mr-2">
                  <Link to='/search-results' className="text-black font-bold no-underline">{translate(translations.search)}</Link>
                </li>
                <li>
                  <LanguageDropdown isMobile={false} />
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </nav>
    </div>
  );
}