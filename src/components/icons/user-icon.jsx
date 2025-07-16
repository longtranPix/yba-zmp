import icon from '../../assets/me.png';
import iconActive from '../../assets/me-selected.png';

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
