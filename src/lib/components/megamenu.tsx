import { MenuResources } from './header';
import MenuItem from './menuitem';
import LanguageDropdown from './languagedropdown';

interface MegaMenuProps {
    handleToggle?: (index: number) => void;
    clicked?: number;
    setIsDrawerOpen?: (open: boolean) => void;
    menuData: MenuResources[]
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
                    {!setIsDrawerOpen && menuData.map(({ title, link, children }, index) => {
                        return (
                            <MenuItem
                                key={index}
                                {...{
                                    title,
                                    link,
                                    children,
                                    setIsDrawerOpen,
                                }}
                                onToggle={() => handleToggle && handleToggle(index)}
                                active={clicked === index}
                            />
                        );
                    })}
                    {setIsDrawerOpen && menuData[0].children.map(({ title, link, children }, index) => {
                        return (
                            <MenuItem
                                key={index}
                                {...{
                                    title,
                                    link,
                                    children,
                                    setIsDrawerOpen,
                                }}
                                onToggle={() => handleToggle && handleToggle(index)}
                                active={clicked === index}
                    
                            />
                        );
                    })}
                </ul>
                {setIsDrawerOpen && (
                    <div className='mt-4 px-4'>
                        <LanguageDropdown isMobile={true} />
                    </div>
                )}
            </nav>
        </div>
    );
};

export default MegaMenu;