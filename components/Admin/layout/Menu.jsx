import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../../../assets/images/wwan-icon.png"
import useRipple from "../../../hooks/useRipple";
import classNames from "../../../utils/classNames";

const Menu = ({
    config = {}
}) => {
    const location = useLocation();
    const { createRipple } = useRipple();
    const handleToggleClick = (e) => {
        const toggleLink = e.target.closest('.menu-toggle');
        if (toggleLink) {
            const item = toggleLink.closest('.menu-item');
            if (item.classList.contains('open')) {
                close(item);
            } else {
                closeOthers(item);
                open(item);
            }
        }
    };

    const open = (item) => {
        if (!item || item.classList.contains('open')) return;
        item.classList.add('open', 'active');
    };

    const close = (item) => {
        if (!item || !item.classList.contains('open')) return;
        item.classList.remove('open', 'active');
    };

    const closeOthers = (item) => {
        const siblings = Array.from(item.parentNode.children).filter(
            (sibling) => sibling !== item && sibling.classList.contains('menu-item')
        );
        siblings.forEach((sibling) => close(sibling));
    };
    return (
        <aside id="layout-menu" className="layout-menu">
            <div className="app-brand demo">
                <Link className="app-brand-link" to={'/'}>
                    <span className="app-brand-logo demo">
                        <img src={logo} alt="wwan" />
                    </span>
                    <span className="app-brand-text demo menu-text fw-bold ms-2">WWAN</span>
                </Link>

                <span role="button" className="layout-menu-toggle menu-link text-large ms-auto w-px-40 h-px-40">
                    <i className="fa fa-angle-left"></i>
                </span>
            </div>
            <div className="menu-inner-shadow"></div>
            <ul className="menu-inner py-1">
                <li className={`menu-item ${location.pathname === '/admin/dashboard' ? "active" : ""}`}>
                    <NavLink
                        className="menu-link ripple-link"
                        to="/admin/dashboard"
                        onClick={createRipple}
                    >
                        <div className="d-flex align-items-center">
                            <span className="menu-icon">
                                <i className="fa-regular fa-house"></i>
                            </span>
                            <span className="menu-link-text">Dashboard</span>
                        </div>
                    </NavLink>
                </li>
                <li className="menu-header small text-uppercase">
                    <span className="menu-header-text">Quản lý</span>
                </li>
                <li className={`menu-item ${location.pathname.startsWith('/admin/user') ? "open active" : ""}`}>
                    <span role="button" className="menu-link menu-toggle" onClick={handleToggleClick}>
                        <div className="d-flex align-items-center">
                            <span className="menu-icon">
                                <i className="fa-regular fa-users"></i>
                            </span>
                            <span className="menu-link-text">User</span>
                        </div>
                    </span>

                    <ul className="menu-sub">
                        <li className={classNames('menu-item', { 'active': location.pathname === '/admin/user/list' })}>
                            <Link to="/admin/user/list" className="menu-link">
                                <div className="text-truncate">Danh sách user</div>
                            </Link>
                        </li>

                        <li className={classNames('menu-item', { 'active': location.pathname === '/admin/user/create' })}>
                            <Link to="/admin/user/create" className="menu-link">
                                <div className="text-truncate">Tạo user mới</div>
                            </Link>
                        </li>

                    </ul>
                </li>
                <li className={`menu-item ${location.pathname === '/admin/genre' ? "active" : ""}`}>
                    <NavLink
                        className="menu-link ripple-link"
                        to="/admin/genre"
                        onClick={createRipple}
                    >
                        <div className="d-flex align-items-center">
                            <span className="menu-icon">
                                <i className="fa-regular fa-grid"></i>
                            </span>
                            <span className="menu-link-text">Thể loại</span>
                        </div>
                    </NavLink>
                </li>
                <li className={`menu-item ${location.pathname === '/admin/category' ? "active" : ""}`}>
                    <NavLink
                        className="menu-link ripple-link"
                        to="/admin/category"
                        onClick={createRipple}
                    >
                        <div className="d-flex align-items-center">
                            <span className="menu-icon">
                                <i className="fa-regular fa-layer-group"></i>
                            </span>
                            <span className="menu-link-text">Danh mục</span>
                        </div>
                    </NavLink>
                </li>
                <li className={`menu-item ${location.pathname === '/admin/country' ? "active" : ""}`}>
                    <NavLink
                        className="menu-link ripple-link"
                        to="/admin/country"
                        onClick={createRipple}
                    >
                        <div className="d-flex align-items-center">
                            <span className="menu-icon">
                                <i className="fa-regular fa-earth-americas"></i>
                            </span>
                            <span className="menu-link-text">Quốc gia</span>
                        </div>
                    </NavLink>
                </li>
                <li className={`menu-item ${location.pathname.startsWith('/admin/movie') ? "open active" : ""}`}>
                    <span role="button" className="menu-link menu-toggle" onClick={handleToggleClick}>
                        <div className="d-flex align-items-center">
                            <span className="menu-icon">
                                <i className="fa-regular fa-film"></i>
                            </span>
                            <span className="menu-link-text">Movie</span>
                        </div>
                    </span>

                    <ul className="menu-sub">
                        <li className={classNames('menu-item', { 'active': location.pathname === '/admin/movie/add' })}>
                            <Link to="/admin/movie/add" className="menu-link">
                                <div className="text-truncate">Thêm phim</div>
                            </Link>
                        </li>

                        <li className={classNames('menu-item', { 'active': location.pathname === '/admin/movie/list' })}>
                            <Link to="/admin/movie/list" className="menu-link">
                                <div className="text-truncate">Danh sách phim</div>
                            </Link>
                        </li>

                    </ul>
                </li>
                <li className={`menu-item ${location.pathname === '/admin/series' ? "active" : ""}`}>
                    <NavLink
                        className="menu-link ripple-link"
                        to="/admin/series"
                        onClick={createRipple}
                    >
                        <div className="d-flex align-items-center">
                            <span className="menu-icon">
                                <i className="fa-regular fa-file-lines"></i>
                            </span>
                            <span className="menu-link-text">Series phim</span>
                        </div>
                    </NavLink>
                </li>
                <li className={`menu-item ${location.pathname === '/admin/episode/list' ? "active" : ""}`}>
                    <NavLink
                        className="menu-link ripple-link"
                        to="/admin/episode/list"
                        onClick={createRipple}
                    >
                        <div className="d-flex align-items-center">
                            <span className="menu-icon">
                                <i className="fa-regular fa-file-lines"></i>
                            </span>
                            <span className="menu-link-text">Danh sách episode</span>
                        </div>
                    </NavLink>
                </li>
                <li className={`menu-item ${location.pathname === '/admin/comments' ? "active" : ""}`}>
                    <NavLink
                        className="menu-link ripple-link"
                        to="/admin/comments"
                        onClick={createRipple}
                    >
                        <div className="d-flex align-items-center">
                            <span className="menu-icon">
                                <i className="fa-regular fa-message-dots"></i>
                            </span>
                            <span className="menu-link-text">Bình luận</span>
                        </div>
                    </NavLink>
                </li>
                <li className={`menu-item ${location.pathname === '/admin/report' ? "active" : ""}`}>
                    <NavLink
                        className="menu-link ripple-link"
                        to="/admin/report"
                        onClick={createRipple}
                    >
                        <div className="d-flex align-items-center">
                            <span className="menu-icon">
                                <i className="fa-regular fa-message-exclamation"></i>
                            </span>
                            <span className="menu-link-text">Báo cáo bình luận</span>
                        </div>
                    </NavLink>
                </li>
            </ul>
        </aside>
    )
}
export default Menu;