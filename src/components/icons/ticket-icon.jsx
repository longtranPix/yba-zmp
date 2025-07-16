import icon from '../../assets/ticket.png';
import iconActive from '../../assets/ticket-selected.png';

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
