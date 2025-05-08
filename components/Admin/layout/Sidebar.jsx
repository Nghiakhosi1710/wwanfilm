
import { Link, NavLink, useLocation } from "react-router-dom";
import "../../../assets/scss/_sidebar.scss";
import useRipple from "../../../hooks/useRipple";
import classNames from "../../../utils/classNames";
import logo from "../../../assets/images/wwan-logo-text.png";
import useDeviceType from "../../../hooks/useDeviceType";
import { useMemo } from "react";
import { useSelector } from "react-redux";

const Sidebar = ({ isSidebarHidden, handleToggleSidebar }) => {
    const { user } = useSelector((state) => state.user);
    const { createRipple } = useRipple();
    const location = useLocation();
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);

    const handleToggleClick = (e) => {
        const toggleLink = e.target.closest('.nav-group-toggle');
        if (toggleLink) {
            const item = toggleLink.closest('.nav-group');
            if (item.classList.contains('show')) {
                close(item);
            } else {
                closeOthers(item);
                open(item);
            }
        }
    };

    const open = (item) => {
        if (!item || item.classList.contains('show')) return;
        const navGroupItems = item.querySelector('.nav-group-items');
        navGroupItems.style.height = `${navGroupItems.scrollHeight}px`;
        item.classList.add('show', 'active');
    };

    const close = (item) => {
        if (!item || !item.classList.contains('show')) return;
        const navGroupItems = item.querySelector('.nav-group-items');
        navGroupItems.style.height = '0';
        item.classList.remove('show', 'active');
    };

    const closeOthers = (item) => {
        const siblings = Array.from(item.parentNode.children).filter(
            (sibling) => sibling !== item && sibling.classList.contains('nav-group')
        );
        siblings.forEach((sibling) => close(sibling));
    };

    return (
        <div className={classNames("sidebar sidebar-dark sidebar-fixed border-end", { "hide": !isMobile && isSidebarHidden, "show": isMobile && isSidebarHidden })} >
            <div className="sidebar-header border-bottom">
                <div className="sidebar-brand">
                    <img src={logo} alt="" className="sidebar-brand-full" width="90" />
                </div>
                <button className="btn-close d-lg-none" type="button" onClick={handleToggleSidebar}></button>
            </div>
            <ul className="sidebar-nav simplebar-scrollable-y" >
                <div className="simplebar-wrapper">
                    <div className="simplebar-mask">
                        <div className="simplebar-offset">
                            <div className="simplebar-content-wrapper" tabIndex="0" role="region" aria-label="scrollable content">
                                <div className="simplebar-content">
                                    <li className="nav-item">
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link ripple-link", { "pending": isPending, "active": isActive })
                                        } to={'/admin/dashboard'} onClick={createRipple}>
                                            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="800px" height="800px" viewBox="0 0 1920 1920">
                                                <path d="M833.935 1063.327c28.913 170.315 64.038 348.198 83.464 384.79 27.557 51.84 92.047 71.944 144 44.387 51.84-27.558 71.717-92.273 44.16-144.113-19.426-36.593-146.937-165.46-271.624-285.064Zm-43.821-196.405c61.553 56.923 370.899 344.81 415.285 428.612 56.696 106.842 15.811 239.887-91.144 296.697-32.64 17.28-67.765 25.411-102.325 25.411-78.72 0-154.955-42.353-194.371-116.555-44.386-83.802-109.102-501.346-121.638-584.245-3.501-23.717 8.245-47.21 29.365-58.277 21.346-11.294 47.096-8.02 64.828 8.357ZM960.045 281.99c529.355 0 960 430.757 960 960 0 77.139-8.922 153.148-26.654 225.882l-10.39 43.144h-524.386v-112.942h434.258c9.487-50.71 14.231-103.115 14.231-156.084 0-467.125-380.047-847.06-847.059-847.06-467.125 0-847.059 379.935-847.059 847.06 0 52.97 4.744 105.374 14.118 156.084h487.454v112.942H36.977l-10.39-43.144C8.966 1395.137.044 1319.128.044 1241.99c0-529.243 430.645-960 960-960Zm542.547 390.686 79.85 79.85-112.716 112.715-79.85-79.85 112.716-112.715Zm-1085.184 0L530.123 785.39l-79.85 79.85L337.56 752.524l79.849-79.85Zm599.063-201.363v159.473H903.529V471.312h112.942Z" fillRule="evenodd" />
                                            </svg>
                                            Dashboard
                                        </NavLink>
                                    </li>
                                    <li className="nav-title">Phân loại dữ liệu</li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link ripple-link", { "pending": isPending, "active": isActive })
                                        } to={"/admin/genre"} onClick={createRipple}>
                                            <i className="fas fa-icons nav-icon"></i>
                                            Genre
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link ripple-link", { "pending": isPending, "active": isActive })
                                        } to={"/admin/category"} onClick={createRipple}>
                                            <i className="fas fa-layer-group nav-icon"></i>
                                            Category
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link ripple-link", { "pending": isPending, "active": isActive })
                                        } to={"/admin/country"} onClick={createRipple}>
                                            <i className="fas fa-globe nav-icon"></i>
                                            Country
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link ripple-link", { "pending": isPending, "active": isActive })
                                        } to={"/admin/series"} onClick={createRipple}>
                                            <i className="fas fa-film nav-icon"></i>
                                            Series
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link ripple-link", { "pending": isPending, "active": isActive })
                                        } to={"/admin/episode/list"} onClick={createRipple}>
                                            <i className="fas fa-list-ul nav-icon"></i>
                                            List episode
                                        </NavLink>
                                    </li>
                                    <li className="nav-title">Page</li>
                                    <li className="nav-group">
                                        <span className="nav-link nav-group-toggle" onClick={handleToggleClick}>
                                            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" fill="currentColor">
                                                <path d="m88.278 49.408 82.223 49.333-126.074 71.26V22h21.925v109.63l60.298-32.89-38.37-21.926Z" />
                                            </svg>
                                            Movie
                                        </span>
                                        <ul className="nav-group-items compact">
                                            <li className="nav-item">
                                                <Link className={classNames('nav-link', { 'active': location.pathname === '/admin/movie/add' })} to="/admin/movie/add">
                                                    <span className="nav-icon">
                                                        <span className="nav-icon-bullet"></span>
                                                    </span>
                                                    Add Movie
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link className="nav-link" to="/admin/movie/list">
                                                    <span className="nav-icon">
                                                        <span className="nav-icon-bullet"></span>
                                                    </span>
                                                    List Movie
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="simplebar-placeholder">
                    </div>
                </div>
            </ul>
            <div className="sidebar-footer border-top d-none d-md-flex">
                <div className="sidebar-footer-content">
                    <div className="sidebar-user">
                        <div className="sidebar-user-details">
                            <div className="sidebar-user-name">
                                {user?.name || "Admin"}
                            </div>
                            <div className="sidebar-user-role">
                                {user?.roles?.map((role, index) => {
                                    let label = "";
                                    switch (role) {
                                        case "ROLE_ADMIN":
                                            label = "Admin";
                                            break;
                                        case "ROLE_EDITOR":
                                            label = "Editor";
                                            break;
                                        case "ROLE_USER":
                                            label = "User";
                                            break;
                                        default:
                                            label = role.replace(/^ROLE_/, "");
                                    }
                                    return (
                                        <span key={index} className="badge bg-secondary me-1">{label}</span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="sidebar-footer-end d-flex align-items-center justify-content-center">
                    <button className="sidebar-toggler" type="button" data-coreui-toggle="unfoldable" onClick={handleToggleSidebar}></button>
                </div>
            </div>
        </div>
    )
}

export default Sidebar;