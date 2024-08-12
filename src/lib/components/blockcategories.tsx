import { app, translate } from "../app";
import { Container } from "./container";
import HomePageCards from "./home-page-cards";
import { languages } from "../locale"
import { useAnimateOnScroll } from "./useAnimateOnScroll";

export function BlockCategories(props: { block: BlockCategories }) {
  const { block } = props;
  useAnimateOnScroll();

  const categories: ZendeskCategory[] = Object.values(
    app.data.zendesk.categories
  );
  
  const isRTL = languages[app.locale]?.rtl;

  return (
    <Container block={block} className={isRTL ? 'rtl' : ''}>
      <h1 className={`fade-up-0 ${isRTL ? 'text-right' : 'text-left'}`}
      data-animation="animate__fadeInUp">{translate(block.title)} </h1>
      <h2 className={`fade-up-1 ${isRTL ? 'text-right' : 'text-left'}`}
      data-animation="animate__fadeInUp">
        {translate(block.subtitle)}
      </h2>
      <div className="fade-up-2"
      data-animation="animate__fadeInUp">
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
        </div>
    </Container>
  );
}
