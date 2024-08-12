import { RightOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { translate } from "../app";
import { translations } from "../../translations";
import { Link } from 'react-router-dom';

const DropdownContent = ({
    submenuscontent,
    setIsDrawerOpen,
    handleClick,
}) => {
    const [activeIndex, setActiveIndex] = useState(null)
    const [activeItem, setActiveItem] = useState(null)

    const handleSectionClick = (index, item: any) => {
        setActiveIndex(activeIndex === index ? null : index)
        setActiveItem(item)
    };

    return (
        <div>
            {!setIsDrawerOpen && <div className='dropdown_content mb-8'>
                <span className='text-zinc-600'>{translate(translations.resourcesCategories)}</span>
                <span className='text-zinc-600'>{translate(translations.topic)}</span>
            </div>}
            <div className="dropdown_content">
                <div className='category-section-container'>
                    {submenuscontent?.map((item, index) => (
                        <section
                            key={index}
                            className='parent-section flex justify-between cursor-pointer'
                            onMouseEnter={() => handleSectionClick(index, item)}
                        >
                            <Link
                                className={`${index === activeIndex ? 'text-zinc-500' : 'text-black'} ${setIsDrawerOpen ? 'my-2' : 'no-underline'}`}
                                to={item.link}
                                onClick={() => {
                                    setIsDrawerOpen && setIsDrawerOpen(false);
                                    handleClick()
                                }}>
                                {item.children && <h2 className='m-0'>{translate(item.title)}</h2>}
                                {!item.children && <span>{translate(item.title)}</span>}
                            </Link>
                            {item.children && <RightOutlined />}
                        </section>
                    ))}
                </div>
                <div className='subcat-section-container'>
                    {activeItem?.children?.map(({ title, link }, index) => (
                        <section
                            key={index}
                            onClick={() => {
                                setIsDrawerOpen && setIsDrawerOpen(false);
                                handleClick();
                            }}>
                            <Link className='no-underline text-black' to={link}>{translate(title)}</Link>
                        </section>
                    ))}
                </div>
                <div className='border-l border-l-[#DDDDDD] border-solid border-t-0 border-r-0 border-b-0'></div>
            </div>
        </div>
    );
};

export default DropdownContent;
