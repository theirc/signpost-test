import { MenuCategory } from './header';
import MenuItem from './menuitem';

interface MegaMenuProps {
    handleToggle?: (index: number) => void;
    clicked?: number;
    setIsDrawerOpen?: (open: boolean) => void;
    menuData: MenuCategory[]
}

const MegaMenu: React.FC<MegaMenuProps> = ({
    handleToggle,
    clicked,
    setIsDrawerOpen,
    menuData
}) => {
    return (
        <div className="nav__container">
            <nav>
                <ul>
                    {!setIsDrawerOpen && menuData.map(({ label, href, children }, index) => {
                        return (
                            <MenuItem
                                key={index}
                                {...{
                                    label,
                                    href,
                                    children,
                                    setIsDrawerOpen,
                                }}
                                onToggle={() => handleToggle && handleToggle(index)}
                                active={clicked === index}
                            />
                        );
                    })}
                    {setIsDrawerOpen && menuData[0].children.map(({ label, href, children }, index) => {
                        return (
                            <MenuItem
                                key={index}
                                {...{
                                    label,
                                    href,
                                    children,
                                    setIsDrawerOpen,
                                }}
                                onToggle={() => handleToggle && handleToggle(index)}
                                active={clicked === index}
                            />
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
};

export default MegaMenu;