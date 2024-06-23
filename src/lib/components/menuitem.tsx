import { NavLink } from 'react-router-dom';
import Container from './menucontainer';
import DropdownContent from './dropdowncontent';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

const MenuItem = ({
    label,
    href,
    children,
    onToggle,
    active,
    setIsDrawerOpen,
}) => {
    const handleClick = () => {
        const activeElement = document.activeElement;
    };

    return (
        <li>
            <div className="nav_item_content py-4">
                <NavLink
                    to={''}
                    className={({ isActive }) => (isActive ? 'active no-underline' : 'no-underline')}
                    onClick={onToggle}
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
                        }`}
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