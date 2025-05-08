import { useDispatch, useSelector } from "react-redux";
import "../../../assets/scss/_header.scss";
import useDropdown from "../../../hooks/useDropdown";
import useThemeChange from "../../../hooks/useThemeChange";
import { useCallback } from "react";
import { logout } from "../../../features/userSlice";
import { Link, useLocation } from "react-router-dom";

const Header = ({
    handleToggleSidebar
}) => {
    const { user: currentUser } = useSelector((state) => state.user);
    const { openDropdown, toggleDropdown, dropdownRefCallback } = useDropdown();
    const { activeTheme, changeTheme } = useThemeChange();
    const dispatch = useDispatch();
    const location = useLocation();
    const breadcrumbItems = location.pathname.replace('admin', '').split('/').filter(item => item !== '');
    const convertUrlToText = (url) => {
        return url.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\//g, ' ').trim();
    };

    const logOut = useCallback(() => dispatch(logout())
        .then(() => {
            window.location.href = '/';
        })
        , [dispatch]);

    const getAvatarUrl = () => {
        if (currentUser.avatar === null) {
            const initials = currentUser.name.split(' ').map(word => word[0].toUpperCase()).join('');
            return `https://ui-avatars.com/api/?name=${initials}&background=random&color=white`;
        } else {
            return currentUser.avatar;
        }
    };

    return (
        <header className="header header-sticky p-0 mb-4">
            <div className="container-fluid border-bottom px-4 d-flex flex-wrap align-items-center justify-content-between">
                <button className="header-toggler" type="button" onClick={handleToggleSidebar}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -0.5 21 21" version="1.1">
                        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                            <g transform="translate(-139.000000, -200.000000)" fill="currentColor">
                                <g transform="translate(56.000000, 160.000000)">
                                    <path d="M101.9,57.009 C101.9,57.56 101.38235,58 100.80275,58 L97.65275,58 C97.0742,58 96.65,57.56 96.65,57.009 L96.65,54.009 C96.65,53.458 97.0742,53 97.65275,53 L100.80275,53 C101.38235,53 101.9,53.458 101.9,54.009 L101.9,57.009 Z M100.80275,51 L97.65275,51 C95.9129,51 94.55,52.352 94.55,54.009 L94.55,57.009 C94.55,58.666 95.9129,60 97.65275,60 L100.80275,60 C102.5426,60 104,58.666 104,57.009 L104,54.009 C104,52.352 102.5426,51 100.80275,51 L100.80275,51 Z M90.35,57.009 C90.35,57.56 89.83235,58 89.25275,58 L86.10275,58 C85.5242,58 85.1,57.56 85.1,57.009 L85.1,54.009 C85.1,53.458 85.5242,53 86.10275,53 L89.25275,53 C89.83235,53 90.35,53.458 90.35,54.009 L90.35,57.009 Z M89.25275,51 L86.10275,51 C84.3629,51 83,52.352 83,54.009 L83,57.009 C83,58.666 84.3629,60 86.10275,60 L89.25275,60 C90.9926,60 92.45,58.666 92.45,57.009 L92.45,54.009 C92.45,52.352 90.9926,51 89.25275,51 L89.25275,51 Z M101.9,46.009 C101.9,46.56 101.38235,47 100.80275,47 L97.65275,47 C97.0742,47 96.65,46.56 96.65,46.009 L96.65,43.009 C96.65,42.458 97.0742,42 97.65275,42 L100.80275,42 C101.38235,42 101.9,42.458 101.9,43.009 L101.9,46.009 Z M100.80275,40 L97.65275,40 C95.9129,40 94.55,41.352 94.55,43.009 L94.55,46.009 C94.55,47.666 95.9129,49 97.65275,49 L100.80275,49 C102.5426,49 104,47.666 104,46.009 L104,43.009 C104,41.352 102.5426,40 100.80275,40 L100.80275,40 Z M90.35,46.009 C90.35,46.56 89.83235,47 89.25275,47 L86.10275,47 C85.5242,47 85.1,46.56 85.1,46.009 L85.1,43.009 C85.1,42.458 85.5242,42 86.10275,42 L89.25275,42 C89.83235,42 90.35,42.458 90.35,43.009 L90.35,46.009 Z M89.25275,40 L86.10275,40 C84.3629,40 83,41.352 83,43.009 L83,46.009 C83,47.666 84.3629,49 86.10275,49 L89.25275,49 C90.9926,49 92.45,47.666 92.45,46.009 L92.45,43.009 C92.45,41.352 90.9926,40 89.25275,40 L89.25275,40 Z">
                                    </path>
                                </g>
                            </g>
                        </g>
                    </svg>
                </button>
                <ul className="header-nav d-none d-lg-flex">
                    <li className="nav-item"><span className="nav-link">Chào, {currentUser?.name}!</span></li>
                    <li className="nav-item"><Link className="nav-link" to={'/'} target="_blank">Xem web <i className="fas fa-external-link-alt"></i></Link></li>
                    <li className="nav-item"><Link className="nav-link" >Settings</Link></li>
                </ul>
                <ul className="header-nav ms-auto">
                    <li className="nav-item">
                        <Link className="nav-link" href="#">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="20px" height="20px" viewBox="0 0 24 24"><path d="M10,21h4a2,2,0,0,1-4,0ZM3.076,18.383a1,1,0,0,1,.217-1.09L5,15.586V10a7.006,7.006,0,0,1,6-6.92V2a1,1,0,0,1,2,0V3.08A7.006,7.006,0,0,1,19,10v5.586l1.707,1.707A1,1,0,0,1,20,19H4A1,1,0,0,1,3.076,18.383ZM6.414,17H17.586l-.293-.293A1,1,0,0,1,17,16V10A5,5,0,0,0,7,10v6a1,1,0,0,1-.293.707Z" /></svg>
                        </Link>
                    </li>

                </ul>
                <ul className="header-nav">
                    <li className="nav-item py-1">
                        <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
                    </li>
                    <li className="nav-item dropdown" ref={(el) => dropdownRefCallback(el, 2)}>
                        <button className="btn btn-link nav-link py-2 px-2 d-flex align-items-center"
                            aria-label={`Toggle theme (${activeTheme})`}
                            onClick={(e) => toggleDropdown(2, e)}
                        >
                            <i className={`fa fa-${activeTheme === "light"
                                ? "sun-bright"
                                : activeTheme === "dark"
                                    ? "moon"
                                    : "desktop"
                                } icon-base icon-md theme-icon-active`}></i>
                        </button>
                        <ul className={`dropdown-menu dropdown-menu-end ${openDropdown === 2 ? "show" : ""}`} data-bs-popper>
                            {["light", "dark", "system"].map((theme) => (
                                <li key={theme}>
                                    <button
                                        type="button"
                                        className={`dropdown-item d-flex align-items-center ${activeTheme === theme ? "active" : ""}`}
                                        data-ww-theme-value={theme}
                                        aria-pressed={activeTheme === theme ? "true" : "false"}
                                        onClick={() => changeTheme(theme)}
                                    >
                                        <span>
                                            <i
                                                className={`icon-base fa-regular fa-${theme === "dark" ? "moon" : theme === "system" ? "desktop" : "sun-bright"} icon-sm me-3`}
                                                data-icon={theme}
                                            ></i>
                                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </li>
                    <li className="nav-item py-1">
                        <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
                    </li>
                    <li className="nav-item dropdown" ref={(el) => dropdownRefCallback(el, 1)}>
                        <button className="nav-link py-0 pe-0" onClick={(e) => toggleDropdown(1, e)} wwan-toggle="dropdown">
                            <div className="avatar avatar-sm"><img className="avatar-img" src={getAvatarUrl()} alt="user@email.com" /></div>
                        </button>
                        <div className={`dropdown-menu dropdown-menu-end pt-0${openDropdown === 1 ? " show" : ""}`} data-bs-popper>
                            <div className="dropdown-header bg-body-tertiary text-body-secondary fw-semibold rounded-top mb-2">Account</div>

                            <Link className="dropdown-item" href="#">
                                Messages<span className="badge badge-sm bg-success ms-2">42</span>
                            </Link>
                            <a className="dropdown-item" href="#">
                                Tasks<span className="badge badge-sm bg-danger ms-2">42</span>
                            </a>
                            <Link className="dropdown-item" to="/admin/comments">
                                Comments<span className="badge badge-sm bg-warning ms-2"></span>
                            </Link>

                            <div className="dropdown-divider"></div>
                            <a className="dropdown-item" href="#">
                                Lock Account
                            </a>
                            <button className="dropdown-item" type="button" onClick={logOut}>
                                Logout
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
            <div className="container-fluid px-4 d-flex flex-wrap align-items-center justify-content-between">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb my-0">
                        <li className="breadcrumb-item">
                            <Link to="/">
                                Home
                            </Link>
                        </li>
                        {breadcrumbItems.map((item, index) => (
                            <li key={index} className="breadcrumb-item">
                                {index === breadcrumbItems.length - 1 ? (
                                    <span>{convertUrlToText(item)}</span>
                                ) : (
                                    <span to={`/${breadcrumbItems.slice(0, index + 1).join('/')}`}>{convertUrlToText(item)}</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>
        </header>
    )
}

export default Header;