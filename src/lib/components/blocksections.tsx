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
      <h1 className="text-4xl font-normal mt-0 pt-0">{translate(block.title)} </h1>
      <h2 className="text-2xl font-medium">
        {translate(block.subtitle)}
      </h2>
        {Object.keys(groupedByCategory).map((categoryId) => (
          <>
            <h3 className="my-10 font-normal">
              {translate(categories.find((x) => x.id === +categoryId).name)}
            </h3>

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
          </>
        ))}
    </Container>
  );
}
