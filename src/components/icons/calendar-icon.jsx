import icon from '../../assets/calendar.png';
import iconActive from '../../assets/calendar-selected.png';

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
