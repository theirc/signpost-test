import { app, translate } from "../app";
import { Container } from "./container";
import HomePageCards from "./home-page-cards";
import { languages } from "../locale"
import { useAnimateOnScroll } from "./useAnimateOnScroll";

export function BlockSections(props: { block: BlockSections }) {
  const { block } = props;
  useAnimateOnScroll();
  const locale = languages[app.locale]?.zendesk as string ?? app.locale

  const sections: ZendeskSection[] = Object.values(app.data.zendesk.sections);
  const categories: ZendeskCategory[] = Object.values(
    app.data.zendesk.categories
  );


  const groupedByCategory = {};

  sections.forEach((item) => {
    const categoryId = item.category;
    if (!groupedByCategory[categoryId]) {
      groupedByCategory[categoryId] = [];
    }
    groupedByCategory[categoryId].push(item);
  });

  const isRTL = languages[app.locale]?.rtl;

  return (
    <Container block={block}>
    <h1 className={`fade-up-0 ${isRTL ? 'text-right' : 'text-left'}`} data-animation="animate__fadeInUp">{translate(block.title)}</h1>
    <h2 className={`fade-up-1 ${isRTL ? 'text-right' : 'text-left'}`} data-animation="animate__fadeInUp">
      {translate(block.subtitle)}
    </h2>
    <div>
      {Object.keys(groupedByCategory).map((categoryId) => (
        <div key={categoryId}>
          <h3 className={`fade-up-2 my-10 text-2xl font-medium ${isRTL ? 'text-right' : 'text-left'}`} data-animation="animate__fadeInUp">
            {translate(categories.find((x) => x.id === +categoryId)?.name)}
          </h3>
          <div className="fade-up-3" data-animation="animate__fadeInUp">
            <HomePageCards
              cards={groupedByCategory[categoryId]?.map(
                (section: ZendeskSection) => {
                  const path =
                    !categoryId
                      ? `/${locale.toLowerCase()}/categories/`
                      : section.id === 0
                      ? `/${locale.toLowerCase()}/categories/${categoryId}/`
                      : `/${locale.toLowerCase()}/categories/${categoryId}/${section.id}/`;

                  return {
                    title: translate(section.name),
                    subtitle: translate(section.description),
                    iconName: "",
                    href: path, 
                  };
                }
              )}
            />
          </div>
        </div>
      ))}
    </div>
  </Container>
);
}