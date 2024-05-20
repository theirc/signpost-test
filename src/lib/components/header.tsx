import { CSSProperties } from "react";
import { app, translate } from "../app";
import { Link } from "react-router-dom";

export function Header() {
  const styles: CSSProperties = {};

  if (app.page.header.color) styles.color = app.page.header.color;
  if (app.page.header.bgcolor) styles.backgroundColor = app.page.header.bgcolor;

  const categories = Object.values(app.data.zendesk.categories);
  const sections = Object.values(app.data.zendesk.sections);

  const infoMenus = app.page.header.menu.filter((item) => item.type === "info");
  const aboutMenu = app.page.header.menu.find((item) => item.type === "about");

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
      const title = item.title ? translate(item.title) : "";
      if (item.content && item.content.length > 0) {
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

  return (
    <div className="h-10 flex p-4 uppercase text-sm tracking-wide" style={styles}>
      <div>
        <Link to="/">
          <img src={app.logo} height={40} alt="Logo" />
        </Link>
      </div>
      <div className="flex-grow" />
      <div className="flex gap-4">
        {renderMenuItems(app.page.header.menu)}
      </div>
    </div>
  );
}