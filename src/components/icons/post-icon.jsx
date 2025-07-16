import icon from "../../assets/post.png";
import iconActive from "../../assets/post-selected.png";

const NavIcon = ({ customClass, active }) => {
	if (active) {
		return <img className={customClass} src={iconActive} />;
	}
	return <img className={customClass} src={icon} />;
};

export default NavIcon;
