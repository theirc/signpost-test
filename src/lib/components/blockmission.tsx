import { CSSProperties } from "react"
import { useNavigate } from "react-router-dom";
import { Button} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { translate } from "../app"
import { Container } from "./container"
import Search from "antd/es/input/Search";
import { translations } from "../../translations";
import { useAnimateOnScroll } from "./useAnimateOnScroll";

export function BlockMission(props: { block: BlockMission}) {
  const { block } = props
  const navigate = useNavigate();
  useAnimateOnScroll();


  const handleSearch = (value: string) => {
      navigate(`/search-results?query=${value}`);
  };

  return <Container block={block}>
    <div className="py-12 px-4 max-w-4xl mx-auto container-center">
    <h1 className="fade-up-0 text-3xl md:text-4xl text-center max-w-xl mission-heading"           data-animation="animate__fadeInUp">{translate(block.title)}</h1>
   
 
    <Search
   placeholder= {translate(translations.searchForInformation)}
   enterButton={<Button type="primary" icon={<SearchOutlined />}>{translate(translations.search)}</Button>}
   size="large"
   onSearch={handleSearch}
   className="fade-up-1 header-search-input"
   data-animation="animate__fadeInUp"
   />
   </div>
  </Container>
} 