import { List, Space, Typography } from "antd";
import React, { useState } from "react";

import SelectMenu, { MenuItem } from "./select-menu";
import { Link } from "react-router-dom";

const { Text, Title } = Typography;
export interface Section {
  id: number;
  name: string;
  description?: string;
  articles: Article[];
}

export interface Article {
  id: number;
  title: string;
  lastEdit: { value: string; label: string };
}

interface SectionContentProps {
  section: Section;
}

export const getDateString = (value: string, label: string): string => {
  if (!value || !label) return "";
  const formatter = new Intl.DateTimeFormat();
  return `${label}: ${formatter.format(Date.parse(value))}`;
};

export function SectionWithArticles({ section }: SectionContentProps) {
  return (
    <List
      itemLayout="horizontal"
      className="section"
      header={
        section.description ? (
          <>
            <Title level={3}>{section.name}</Title>
            <Text type="secondary">{section.description}</Text>
          </>
        ) : (
          <Title level={3}>{section.name}</Title>
        )
      }
      dataSource={section.articles}
      renderItem={(item) => (
        <List.Item key={item.id}>
          <List.Item.Meta
            title={
              <Link to={`/article/${item.id}`}>
                <a style={{ fontSize: 16 }}>{item.title}</a>
              </Link>
            }
            description={
              <Text type="secondary" style={{ fontSize: "0.85rem" }}>
                {getDateString(item.lastEdit.value, item.lastEdit.label)}
              </Text>
            }
          />
        </List.Item>
      )}
    />
  );
}

interface TopicWithArticlesProps {
  // Id of the selected topic.
  topicId: number;
  // List of topics.
  topicItems: MenuItem[];
  // List of sections with articles.
  sections: Section[];
  // A label for select topic dropdown.
  selectTopicLabel: string;
  // On select topic change action.
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  onSelectChange: (val: any) => void;
}

export default function TopicWithArticles({
  topicId,
  topicItems,
  sections,
  selectTopicLabel,
  onSelectChange,
}: TopicWithArticlesProps) {
  const [sectionFilterValue, setSectionFilterValue] = useState<
    number | undefined
  >(undefined);

  return (
    <Space direction="vertical" size="large" className="topic">
      <div className="select-menu-container">
        <SelectMenu
          label={selectTopicLabel}
          items={topicItems}
          showIcon={true}
          iconType="outlined"
          size="large"
          initialValue={topicId}
          onSelectChange={() => {
            setSectionFilterValue(undefined);
            onSelectChange;
          }}
        />
      </div>
      {sections.map((section) => (
        <SectionWithArticles key={section.id} section={section} />
      ))}
    </Space>
  );
}
