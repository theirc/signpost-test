import { app, translate } from "../app"
import { Container } from "./container"
import { Loader } from "./loader"
import { Map } from "./map"
import { Tabs } from 'antd'
import type { TabsProps } from 'antd'
import { ServicesList } from "./services"

export function BlockServices(props: { block: BlockServices }) {

  const { block } = props

  const { state: { servicesLoaded } } = app

  const items: TabsProps['items'] = [
    {
      key: 'map',
      label: 'Map View',
      children: <Map />,
    },
    {
      key: 'list',
      label: 'List View',
      children: <ServicesList />,
    },
  ]

  return <Container block={block} className="transition-all">
    <div className="text-4xl">{translate(props.block.title)}</div>
    <div className="text-2xl mt-4 opacity-50">{translate(props.block.subtitle)}</div>
    {servicesLoaded && <Tabs defaultActiveKey="list" items={items} />}
    {!servicesLoaded && <div className="flex items-center justify-center my-16">
      <Loader size={72} width={12} className="bg-gray-500" />
    </div>}

  </Container>

}