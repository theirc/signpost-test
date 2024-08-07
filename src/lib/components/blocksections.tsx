import { app, translate } from "../app";
import { Container } from "./container";
import HomePageCards from "./home-page-cards";
import { languages } from "../locale"
import { useAnimateOnScroll } from "./useAnimateOnScroll";

export function BlockSections(props: { block: BlockSections }) {
  const { block } = props;
  const sections: ZendeskSection[] = Object.values(app.data.zendesk.sections);
  const categories: ZendeskCategory[] = Object.values(
    app.data.zendesk.categories
  );

  useAnimateOnScroll(".fade-up-0", "animate__fadeInUp", "1.5s");
  useAnimateOnScroll(".fade-up-1", "animate__fadeInUp", "1.5s");
  useAnimateOnScroll(".fade-up-2", "animate__fadeInUp", "1.5s");
  useAnimateOnScroll(".fade-up-3", "animate__fadeInUp", "5s");

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
    <h1 className={`fade-up-0 ${isRTL ? 'text-right' : 'text-left'}`}>{translate(block.title)}</h1>
    <h2 className={`fade-up-1 ${isRTL ? 'text-right' : 'text-left'}`}>
      {translate(block.subtitle)}
    </h2>
    <div className="fade-up-2">
      {Object.keys(groupedByCategory).map((categoryId) => (
        <div key={categoryId}>
          <h3 className={`my-10 text-2xl font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
            {translate(categories.find((x) => x.id === +categoryId)?.name)}
          </h3>
          <div className="fade-up-3">
            <HomePageCards
              cards={groupedByCategory[categoryId]?.map(
                (section: ZendeskSection) => {
                  const path =
                    !categoryId
                      ? "/categories/"
                      : section.id === 0
                      ? `/categories/${categoryId}/`
                      : `/categories/${categoryId}/${section.id}/`;

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