import { app, translate } from "../app";
import { Container } from "./container";
import HomePageCards from "./home-page-cards";

export function BlockSections(props: { block: BlockSections }) {
  const { block } = props;
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

  return (
    <Container block={block}>
      <div className="text-4xl">{translate(block.title)} </div>
      <div className="text-2xl mt-4 text-gray-500">
        {translate(block.subtitle)}
      </div>
      <section>
        {Object.keys(groupedByCategory).map((categoryId) => (
          <>
            <div className="text-2xl mt-4">
              {translate(categories.find((x) => x.id === +categoryId).name)}
            </div>

            <HomePageCards
              cards={groupedByCategory[categoryId]?.map(
                (section: ZendeskSection) => {
                  return {
                    title: translate(section.name),
                    subtitle: translate(section.description),
                    iconName: "",
                    href: `/sections/${section.id}`,
                  };
                }
              )}
            />
          </>
        ))}
      </section>
    </Container>
  );
}
