import { app, translate } from "../app";
import { Container } from "./container";
import HomePageCards from "./home-page-cards";
import { languages } from "../locale"
import { useAnimateOnScroll } from "./useAnimateOnScroll";

const colors = [ '#ABDFBF', '#C0E1E0', '#B1C3FB', '#CDA9E9', '#F5ABA7', '#F9D79E', '#FDF1B1' ]

export function BlockCategories(props: { block: BlockCategories }) {
  const { block } = props;
  useAnimateOnScroll();

  const categories: ZendeskCategory[] = Object.values(
    app.data.zendesk.categories
  );
  
  const isRTL = languages[app.locale]?.rtl;

  return (
    <Container block={block} className={isRTL ? 'rtl' : ''}>
      <h1 className={`fade-up-0 text-4xl font-normal leading-snug ${isRTL ? 'text-right' : 'text-left'}`}
      data-animation="animate__fadeInUp">{translate(block.title)} </h1>
      <h2 className={`fade-up-1 text-3xl font-medium leading-normal ${isRTL ? 'text-right' : 'text-left'}`}
      data-animation="animate__fadeInUp">
        {translate(block.subtitle)}
      </h2>
      <div className="fade-up-2"
      data-animation="animate__fadeInUp">
        <HomePageCards
          cards={categories?.map((category, index) => {
            return {
              title: translate(category.name),
              subtitle: translate(category.description),
              iconName: category.icon,
              href: `/categories/${category.id}`,
              color: colors[index % colors.length]
            };
          })}
        />
        </div>
    </Container>
  );
}
