import { NavLink, useLocation } from 'react-router-dom';
import Container from './menucontainer';
import DropdownContent from './dropdowncontent';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { useState } from 'react';

const MenuItem = ({
    label,
    href,
    children,
    onToggle,
    active,
    setIsDrawerOpen,
}) => {
    const [visible, setVisible] = useState(false)
    const location = useLocation()
    const handleClick = () => {
        setVisible(false)
    };

    return (
        <li onMouseLeave={() => setVisible(false)}>
            <div className="nav_item_content py-4">
                <NavLink
                    to={location.pathname}
                    className={({ isActive }) => (isActive ? 'active no-underline' : 'no-underline')}
                    onClick={onToggle}
                    onMouseEnter={() => setVisible(true)}
                    onFocus={() => setVisible(true)}
                >
                    {setIsDrawerOpen && <h2>{label}</h2>}{!setIsDrawerOpen && (<>{label}<DownOutlined className='pl-2' /></>)}
                </NavLink>
                {children && (
                    <button
                        className="md:hidden"
                        onClick={onToggle}
                        aria-label="Toggle dropdown"
                        aria-haspopup="menu"
                        aria-expanded={active ? 'true' : 'false'}
                    >
                        {active ? (
                            <UpOutlined size={20} />
                        ) : (
                            <DownOutlined size={20} />
                        )}
                    </button>
                )}
            </div>
            {children && (
                <div
                    role="menu"
                    className={`dropdown ${active ? 'h-auto' : 'h-0 overflow-hidden md:h-auto'
                        } ${visible ? 'visible' : 'md:invisible'}`}
                    onMouseLeave={handleClick}
                >
                    <Container>
                        <DropdownContent
                            submenuscontent={children}
                            setIsDrawerOpen={setIsDrawerOpen}
                            handleClick={handleClick}
                        />
                    </Container>
                </div>
            )}
        </li>
    );
};

export default MenuItem;