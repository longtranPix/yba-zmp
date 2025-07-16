import icon from '../../assets/home.png';
import iconActive from '../../assets/home-selected.png';

const NavIcon = ({ customClass, active }) => {
    if (active) {
        return (
            <img className={customClass} src={iconActive} />
        )
    }
    return (
        <img className={customClass} src={icon} />
    );
};

export default NavIcon;
