import { CSSProperties } from "react"
import { useNavigate } from "react-router-dom";
import { Button} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { translate } from "../app"
import { Container } from "./container"
import Search from "antd/es/input/Search";

export function BlockMission(props: { block: BlockMission}) {
  const { block } = props
  const navigate = useNavigate();

  const handleSearch = (value: string) => {
      navigate(`/search-results?query=${value}`);
  };

  return <Container block={block}>
    <div className="py-12 px-4 max-w-4xl mx-auto container-center">
    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center max-w-xl">{translate(block.title)}</h1>
   
   <Search
   placeholder="Search for information"
   enterButton={<Button type="primary" icon={<SearchOutlined />}>Search</Button>}
   size="large"
   onSearch={handleSearch}
   className="header-search-input"
   />
   </div>
  </Container>
} 