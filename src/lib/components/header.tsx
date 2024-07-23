import { CSSProperties, useRef, useState } from "react";
import { app, translate } from "../app";
import { Link, useNavigate } from "react-router-dom";
import MegaMenu from './megamenu';
import MobileNavigationDrawer from './mobilenavigationdrawer';
import Container from "./menucontainer";
import { CloseOutlined, MenuOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";

const { Search } = Input;

interface SubmenuItemChildren {
  label: string;
  href: string;
}
interface SubmenuItem {
  label: string;
  href: string;
  children?: SubmenuItemChildren[]
}

export interface MenuCategory {
  label: string;
  href: string;
  children: SubmenuItem[];
}

export function Header() {
  const styles: CSSProperties = {};
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false)
  const navigate = useNavigate()

  const drawerButtonRef = useRef(null);

  if (app.page.header.color) styles.color = app.page.header.color;
  if (app.page.header.bgcolor) styles.backgroundColor = app.page.header.bgcolor;

  const categories = Object.values(app.data.zendesk.categories);
  const sections = Object.values(app.data.zendesk.sections);

  const infoMenus = app.page.header.menu.filter((item) => item.type === "info");
  const aboutMenu = app.page.header.menu.find((item) => item.type === "about");
  let menu: MenuCategory[] = []
  let infoMenu: MenuCategory = null

  for (let info of infoMenus) {
    let infoCategories: string[] = []
    let infoSections: string[] = []
    for (let content of info.content) {
      const parts = content.link.split('/')
      if (parts[1] === 'categories') {
        infoCategories.push(parts[2])
      } else if (parts[1] === 'sections') {
        infoSections.push(parts[2])
      }
    }
    let categoriesItems: SubmenuItem[] = []
    for (let cat of categories) {
      let subcatItems: SubmenuItemChildren[] = []
      if (infoCategories.some(x => x === cat.id.toString())) {
        const catSection = Object.values(cat.sections)
        for (let section of catSection) {
          if (infoSections.some(x => x === section.id.toString())) {
            subcatItems.push({ label: translate(section.name), href: `/categories/${cat.id}/${section.id}` })
          }
        }
        categoriesItems.push({ label: translate(cat.name), href: `/categories/${cat.id}`, children: subcatItems })
      }
    }
    infoMenu = { label: 'Resource Center', href: '', children: categoriesItems }
    menu.push(infoMenu)
  }

  infoMenus.forEach((infoMenu) => {
    if (!infoMenu.content) {
      infoMenu.content = [];
    }

    categories.forEach((category) => {
      if (
        !infoMenu.content.some(
          (item) => item.link === `/categories/${category.id}`
        )
      ) {
        infoMenu.content.push({
          title: category.name,
          link: `/categories/${category.id}`,
        });
      }
    });

    sections.forEach((section) => {
      if (
        !infoMenu.content.some(
          (item) => item.link === `/sections/${section.id}`
        )
      ) {
        infoMenu.content.push({
          title: section.name,
          link: `/sections/${section.id}`,
        });
      }
    });
  });
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
      if (item.type === 'info' || item.type === 'menu' || item.type === 'link') return
      const title = item.title ? translate(item.title) : "";
      if (item.content && item.content.length > 0 && item.type === 'about') {
        return (
          <div className="relative group" key={title}>
            <div className="cursor-pointer">
              {title}
              <span className="text-[0.60rem]">▼</span>
            </div>
            <div className="absolute hidden group-hover:block bg-white shadow-lg overflow-auto max-h-96">
              {renderMenuItems(item.content)}
            </div>
          </div>
        );
      } else if (item.type === "services") {
        return (
          <a href="#service-map" key={title} className="mx-1">
            <div className="no-underline">{title}</div>
          </a>
        );
      } else {
        return (
          <Link key={title} to={item.link || "#"} className="mx-1">
            <div className="no-underline">{title}</div>
          </Link>
        );
      }
    });
  };

  const handleSearch = (value: string) => {
    setIsSearchActive(false)
    navigate(`/search-results?query=${value}`)
  }

  return (
    <div className="h-10 flex p-4 text-sm tracking-wide" style={styles}>
      <div className="hidden md:block">
        <Link to="/">
          <img src={app.logo} height={40} alt="Logo" />
        </Link>
      </div>
      <Container>
        <div className="toolbar">
          {!isSearchActive && <>
            <Link to="/" className='md:hidden bg-transparent shadow-none'>
              <img src={app.logo} height={40} alt="Logo" />
            </Link>
            <Button
              type="primary"
              className='md:hidden bg-transparent shadow-none'
              icon={<SearchOutlined />}
              onClick={() => {
                setIsSearchActive(true);
              }}
            />
            <button
              ref={drawerButtonRef}
              className="menu_icon md:hidden"
              aria-haspopup="true"
              onClick={() => setIsDrawerOpen(true)}
            >
              {/* Mobile Hamburger menu */}
              <MenuOutlined />
            </button>
          </>}
          {isSearchActive && <>
            <Search
              placeholder="input search text"
              allowClear
              enterButton="Search"
              size="large"
              onSearch={handleSearch}
              className="md:hidden"
            />
            <Button
              type="primary"
              className='md:hidden bg-transparent shadow-none'
              icon={<CloseOutlined />}
              onClick={() => {
                setIsSearchActive(false);
              }}
            />
          </>}

          <div className="hidden md:block md:w-[490px]">
            {!isSearchActive && <div className="flex gap-4 items-center">
              {renderMenuItems(app.page.header.menu)}
              <MegaMenu menuData={menu} />
              <Link key='search' to='/search-results' className="mx-1">
                <div className="no-underline">Search</div>
              </Link>
              <Link to={"/signpostbot"}>
                <div className="text-white no-underline">Bot</div>
              </Link>
              <Button
                type="primary"
                className='bg-transparent shadow-none'
                icon={<SearchOutlined />}
                onClick={() => {
                  setIsSearchActive(true);
                }}
              />
            </div>}
            {isSearchActive && <div className="flex gap-4 items-center">
              <Search
                placeholder="input search text"
                allowClear
                enterButton="Search"
                size="large"
                onSearch={handleSearch}
              />
              <Button
                type="primary"
                className='bg-transparent shadow-none'
                icon={<CloseOutlined />}
                onClick={() => {
                  setIsSearchActive(false);
                }}
              />
            </div>}
          </div>

          {/* Mobile navigation drawer */}
          <div className="md:hidden absolute">
            <MobileNavigationDrawer
              menuData={menu} {...{ isDrawerOpen, setIsDrawerOpen, drawerButtonRef }}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}