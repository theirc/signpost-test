import { app, translate } from "../app";
import { Container } from "./container";
import HomePageCards from "./home-page-cards";

export function BlockCategories(props: { block: BlockCategories }) {
  const { block } = props;
  const categories: ZendeskCategory[] = Object.values(
    app.data.zendesk.categories
  );

  return (
    <Container block={block}>
      <div className="text-4xl">{translate(block.title)} </div>
      <div className="text-2xl mt-4 text-gray-500">
        {translate(block.subtitle)}{" "}
      </div>
      <section>
        <HomePageCards
          cards={categories?.map((category) => {
            return {
              title: translate(category.name),
              subtitle: translate(category.description),
              iconName: category.icon,
              href: `/categories/${category.id}`,
            };
          })}
        />
      </section>
    </Container>
  );
}
