import React, { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUnreadNotifications, markAsRead, markAllAsRead } from '../features/notificationSlice';
import useDropdown from '../hooks/useDropdown';
import classNames from '../utils/classNames';
import { useAppContext } from '../AppContext';
import Search from './Search';

import '../assets/scss/search.scss';
import '../assets/scss/header-notification.scss';
import logoW from '../assets/images/wwan-logo-text.png';

const USER_DROPDOWN_ID = 3242;
const NOTIFICATION_DROPDOWN_ID = 1234;
const THEME_PANEL_ID = 'theme-settings-panel';

const Header = () => {
    const { currentUser, logOut, setShowFriendRequests, friendRequests, activeTheme, changeTheme } = useAppContext();
    const {
        notifications,
        unreadCount,
        loading: loadingNotifications,
        pagination: notificationPagination
    } = useSelector(state => state.notifications); // Giả sử slice tên là 'notifications'
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { openDropdown, toggleDropdown, dropdownRefCallback } = useDropdown();
    const [showSystem, setShowSystem] = useState(false);
    const [isScroll, setIsScroll] = useState(false);

    const getAvatarUrl = useCallback(() => {
        if (currentUser?.avatar === null || !currentUser?.avatar) { // Thêm kiểm tra !currentUser?.avatar
            const namePart = currentUser?.name || 'User';
            const initials = namePart.split(' ').map(word => word[0]).join('').toUpperCase();
            // Sử dụng background=random
            return `https://ui-avatars.com/api/?name=${initials}&background=20c997&color=fff&size=128`;
        } else {
            // Kiểm tra nếu là URL đầy đủ hoặc đường dẫn tương đối
            return currentUser.avatar.startsWith('http') ? currentUser.avatar : `/${currentUser.avatar}`;
        }
    }, [currentUser]);

    // Đóng panel theme khi dropdown chính đóng
    useEffect(() => {
        if (openDropdown !== USER_DROPDOWN_ID) {
            setShowSystem(false);
        }
    }, [openDropdown]);

    // Xử lý header fixed khi cuộn
    useEffect(() => {
        const handleScroll = () => {
            setIsScroll(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true }); // Thêm passive
        // Gọi lần đầu để set trạng thái đúng
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []); // Dependency rỗng

    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {props.children}
        </Tooltip>
    );

    // Định dạng vai trò
    const formatRoles = (roles = []) => {
        return roles.map(role => role.replace('ROLE_', '')).join(', ') || 'User';
    };

    // Fetch thông báo lần đầu hoặc khi user thay đổi
    useEffect(() => {
        if (currentUser) {
            dispatch(fetchUnreadNotifications({ page: 1, limit: 10 })); // Fetch trang đầu
        }
    }, [currentUser, dispatch]);


    // --- Xử lý cho Notification Dropdown ---
    const handleNotificationClick = (notification) => {
        // Đánh dấu đã đọc
        if (!notification.isRead) {
            dispatch(markAsRead(notification.id));
        }
        // Đóng dropdown
        toggleDropdown(NOTIFICATION_DROPDOWN_ID); // Đóng dropdown
        // Điều hướng đến link (nếu có)
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleMarkAllRead = () => {
        dispatch(markAllAsRead());
        // toggleDropdown(NOTIFICATION_DROPDOWN_ID); // Tùy chọn: đóng dropdown sau khi đánh dấu
    };

    const loadMoreNotifications = () => {
        if (notificationPagination.currentPage < notificationPagination.totalPages && !loadingNotifications) {
            dispatch(fetchUnreadNotifications({ page: notificationPagination.currentPage + 1, limit: 10 }));
        }
    };
    return (
        <header className={classNames("w-header", { "header-fixed": isScroll })}>
            <div className="container">
                <div className="header-area shadow">
                    {/* Logo */}
                    <div className="header-logo">
                        <Link to={'/'}><img src={logoW} alt="WWAN Film logo" /></Link>
                    </div>

                    <div className="header-menu">
                        <nav className="navbar">
                            <ul className='navbar-nav'>
                                <li className='nav-item'>
                                    <OverlayTrigger
                                        placement="right"
                                        overlay={renderTooltip({ children: "Trang chủ" })}
                                    >
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link", { "active": isActive, "pending": isPending })
                                        } to={'/'}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none">
                                                <path d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M15 18H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </NavLink>
                                    </OverlayTrigger>
                                </li>
                                <li className='nav-item'>
                                    <OverlayTrigger
                                        placement="right"
                                        overlay={renderTooltip({ children: "Anime" })}
                                    >
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link", { "active": isActive, "pending": isPending })
                                        } to={'/anime'}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M17.8486 6.19085C19.8605 5.81929 21.3391 5.98001 21.8291 6.76327C22.8403 8.37947 19.2594 12.0342 13.8309 14.9264C8.40242 17.8185 3.18203 18.8529 2.17085 17.2367C1.63758 16.3844 2.38148 14.9651 4 13.3897" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                            </svg>
                                        </NavLink>
                                    </OverlayTrigger>
                                </li>
                                <li className='nav-item'>
                                    <OverlayTrigger
                                        placement="right"
                                        overlay={renderTooltip({ children: "Thịnh hành" })}
                                    >
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link", { "active": isActive, "pending": isPending })
                                        } to={'/thinh-hanh'}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 21C16.4183 21 20 17.6439 20 13.504C20 9.76257 17.9654 6.83811 16.562 5.44436C16.3017 5.18584 15.8683 5.30006 15.7212 5.63288C14.9742 7.3229 13.4178 9.75607 11.4286 9.75607C10.1975 9.92086 8.31688 8.86844 9.83483 3.64868C9.97151 3.17868 9.46972 2.80113 9.08645 3.11539C6.9046 4.90436 4 8.51143 4 13.504C4 17.6439 7.58172 21 12 21Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                            </svg>
                                        </NavLink>
                                    </OverlayTrigger>
                                </li>
                                <li className='nav-item'>
                                    <OverlayTrigger
                                        placement="right"
                                        overlay={renderTooltip({ children: "Mục lục" })}
                                    >
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link", { "active": isActive, "pending": isPending })
                                        } to={'/muc-luc'}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none">
                                                <path d="M19 3H5C3.58579 3 2.87868 3 2.43934 3.4122C2 3.8244 2 4.48782 2 5.81466V6.50448C2 7.54232 2 8.06124 2.2596 8.49142C2.5192 8.9216 2.99347 9.18858 3.94202 9.72255L6.85504 11.3624C7.49146 11.7206 7.80967 11.8998 8.03751 12.0976C8.51199 12.5095 8.80408 12.9935 8.93644 13.5872C9 13.8722 9 14.2058 9 14.8729L9 17.5424C9 18.452 9 18.9067 9.25192 19.2613C9.50385 19.6158 9.95128 19.7907 10.8462 20.1406C12.7248 20.875 13.6641 21.2422 14.3321 20.8244C15 20.4066 15 19.4519 15 17.5424V14.8729C15 14.2058 15 13.8722 15.0636 13.5872C15.1959 12.9935 15.488 12.5095 15.9625 12.0976C16.1903 11.8998 16.5085 11.7206 17.145 11.3624L20.058 9.72255C21.0065 9.18858 21.4808 8.9216 21.7404 8.49142C22 8.06124 22 7.54232 22 6.50448V5.81466C22 4.48782 22 3.8244 21.5607 3.4122C21.1213 3 20.4142 3 19 3Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                            </svg>
                                        </NavLink>
                                    </OverlayTrigger>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    <div className="header-right">
                        <div className='header-search me-3'>
                            <Search />
                        </div>
                        {currentUser && (
                            <div className="dropdown-notification dropdown me-3" ref={(el) => dropdownRefCallback(el, NOTIFICATION_DROPDOWN_ID)}>
                                <span
                                    role='button'
                                    className="header-notification-icon dropdown-toggle"
                                    onClick={(e) => {
                                        toggleDropdown(NOTIFICATION_DROPDOWN_ID, e);
                                        // Nếu mở dropdown và có thông báo, fetch lại trang đầu để cập nhật
                                        if (openDropdown !== NOTIFICATION_DROPDOWN_ID) {
                                            dispatch(fetchUnreadNotifications({ page: 1, limit: 10 }));
                                        }
                                    }}
                                    aria-haspopup="true"
                                    aria-expanded={openDropdown === NOTIFICATION_DROPDOWN_ID}
                                >
                                    <i className="fa-regular fa-bell"></i>
                                    {unreadCount > 0 && (
                                        <span className="header-notification-badge badge rounded-pill bg-danger">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </span>
                                <div
                                    className={`dropdown-notification-menu dropdown-menu dropdown-menu-end shadow-lg ${openDropdown === NOTIFICATION_DROPDOWN_ID ? "show" : ""}`}
                                    style={openDropdown === NOTIFICATION_DROPDOWN_ID ? { position: 'absolute', inset: '0px 0px auto auto', margin: '0px', transform: 'translate(-20px, 45px)', minWidth: '320px' } : {}}
                                    data-bs-popper
                                >
                                    <div className="dropdown-notification-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                                        <h6 className="dropdown-notification-title mb-0">Thông báo</h6>
                                        {notifications.length > 0 && (
                                            <button className="btn btn-sm btn-link p-0" onClick={handleMarkAllRead} disabled={loadingNotifications || unreadCount === 0}>
                                                Đánh dấu đã đọc tất cả
                                            </button>
                                        )}
                                    </div>
                                    <div className="dropdown-notification-body overflow-auto py-1" style={{ maxHeight: '350px' }}>
                                        {loadingNotifications && notifications.length === 0 && <div className="p-3 text-center"><span className="spinner-border spinner-border-sm"></span></div>}
                                        {!loadingNotifications && notifications.length === 0 && <p className='text-center text-muted p-3 mb-0'>Không có thông báo mới.</p>}

                                        {notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`dropdown-item notification-item ${notif.isRead ? 'read' : 'unread'}`}
                                                onClick={() => handleNotificationClick(notif)}
                                                role="button"
                                            >
                                                <div className="d-flex align-items-start">
                                                    {notif.sender?.avatar ? (
                                                        <img src={notif.sender.avatar.startsWith('http') ? notif.sender.avatar : `/${notif.sender.avatar}`} alt={notif.sender.name} className="avatar avatar-xs rounded-circle me-2 mt-1" />
                                                    ) : (
                                                        <div className="avatar avatar-xs bg-secondary text-white rounded-circle me-2 mt-1 d-flex align-items-center justify-content-center">
                                                            <i className="fa-regular fa-user small"></i>
                                                        </div>
                                                    )}
                                                    <div className="notification-item-content">
                                                        <p className="mb-0" style={{fontSize: '0.9rem'}}>{notif.message}</p>
                                                        <small className="text-muted">{new Date(notif.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {!loadingNotifications && notificationPagination.currentPage < notificationPagination.totalPages && (
                                             <div className="text-center py-2 border-top">
                                                 <button className="btn btn-sm btn-link" onClick={loadMoreNotifications}>Xem thêm</button>
                                             </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentUser ? (
                            <div className="dropdown-user dropdown" ref={(el) => dropdownRefCallback(el, USER_DROPDOWN_ID)}>
                                <span
                                    role='button'
                                    className="dropdown-toggle hide-arrow p-0 d-flex align-items-center justify-content-center"
                                    onClick={(e) => toggleDropdown(USER_DROPDOWN_ID, e)}
                                >
                                    <div className="avatar">
                                        <img src={getAvatarUrl()} alt={currentUser.name} className="rounded-circle" />
                                    </div>
                                </span>
                                <div
                                    className={`dropdown-menu dropdown-menu-end ${openDropdown === USER_DROPDOWN_ID ? "show" : ""}`}
                                    data-bs-popper
                                >
                                    <div className="position-relative overflow-hidden">
                                        <ul className="w-100" style={showSystem ? { transform: "translateX(-100%)", position: "absolute", opacity: 0, visibility: "hidden", transition: 'opacity .2s, transform .2s' } : { transform: "translateX(0%)", opacity: 1, transition: 'opacity .2s, transform .2s' }}>
                                            <li role="menuitem">
                                                <Link className="dropdown-item" to="/profile">
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0 me-3">
                                                            <div className="avatar">
                                                                <img src={getAvatarUrl()} alt={currentUser.name} className="rounded-circle" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-0 dropdown-item-title">{currentUser.name}</h6> {/* class cho style nếu cần */}
                                                            {/* Sửa logic hiển thị role */}
                                                            <small className="text-body-secondary d-block">{formatRoles(currentUser.roles)}</small>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </li>
                                            <li><div className="dropdown-divider my-1"></div></li>
                                            <li role="menuitem"><Link className="dropdown-item" to="/profile"> <i className="icon-base fa-regular fa-user me-3"></i><span>Hồ sơ của tôi</span> </Link></li>
                                            <li role="menuitem">
                                                <button className="dropdown-item" onClick={() => setShowFriendRequests?.(prev => !prev)}> {/* Thêm ?. để tránh lỗi nếu context thiếu */}
                                                    <span className="d-flex align-items-center align-middle">
                                                        <i className="flex-shrink-0 icon-base fa-regular fa-user-plus me-3"></i>
                                                        <span className="flex-grow-1 align-middle">Lời mời kết bạn</span>
                                                        {/* Kiểm tra friendRequests là mảng và có length > 0 */}
                                                        {Array.isArray(friendRequests) && friendRequests.length > 0 && (<span className="flex-shrink-0 badge rounded-pill bg-danger">{friendRequests.length}</span>)}
                                                    </span>
                                                </button>
                                            </li>
                                            <li role="menuitem">
                                                <button className="dropdown-item" onClick={() => setShowSystem(prev => !prev)} aria-controls={THEME_PANEL_ID} aria-expanded={showSystem}>
                                                    <span className="d-flex align-items-center align-middle">
                                                        <i className="icon-base fa-regular fa-moon me-3"></i>
                                                        <span>Giao diện</span>
                                                        <i className="fa-solid fa-chevron-right ms-auto"></i>
                                                    </span>
                                                </button>
                                            </li>
                                            <li role="menuitem"><Link className="dropdown-item" to="/faq"> <i className="icon-base fa-regular fa-circle-question me-3"></i><span>FAQ</span> </Link></li>
                                            <li><div className="dropdown-divider my-1"></div></li>
                                            <li role="menuitem"><button className="dropdown-item text-danger" onClick={logOut}> <i className="icon-base fa-regular fa-power-off me-3"></i><span>Đăng xuất</span> </button></li>
                                        </ul>

                                        {/* Theme Settings Panel */}
                                        <div className={`settings-panel ${showSystem ? 'settings-panel--visible' : 'settings-panel--hidden'}`}  id={THEME_PANEL_ID} role="dialog" aria-modal="true" aria-labelledby="theme-settings-panel-title" aria-describedby="theme-settings-panel-description">
                                            <div className="settings-panel__header">
                                                <div className="settings-panel__header-left">
                                                    <div
                                                        className="settings-panel__back-button"
                                                        role="button"
                                                        onClick={() => setShowSystem((prev) => !prev)}
                                                        aria-label="Quay lại"
                                                    >
                                                        <div className="settings-panel__icon-wrap">
                                                            <i className="settings-panel__icon-back"></i>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="settings-panel__header-right">
                                                    <span className="settings-panel__title">Chế độ tối</span>
                                                </div>
                                            </div>
                                            <div className="settings-panel__wrapper">
                                                <div className="settings-panel__content">
                                                    <div className="settings-panel__option">
                                                        <div className="settings-panel__option-wrap-icon">
                                                            <div className="settings-panel__option-icon">
                                                                <i className="settings-panel__icon-moon"></i>
                                                            </div>
                                                        </div>
                                                        <div className="settings-panel__option-details">
                                                            <span className="settings-panel__option-title">Chế độ tối</span>
                                                            <span className="settings-panel__option-subtitle">
                                                                Điều chỉnh giao diện của WWAN để giảm độ chói và cho đôi mắt được nghỉ ngơi.
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="settings-panel__mode-options">
                                                        <label className="settings-panel__label">
                                                            <div className="settings-panel__mode-option-wrap">
                                                                <div className={`settings-panel__mode-option ${activeTheme === 'light' ? "active" : ""}`} onClick={() => changeTheme("light")}>
                                                                    <div>
                                                                        <span className="settings-panel__mode-title">Đang tắt</span>
                                                                    </div>
                                                                    <i className="settings-panel__radio-icon"></i>
                                                                </div>
                                                            </div>
                                                        </label>
                                                        <label className="settings-panel__label">
                                                            <div className="settings-panel__mode-option-wrap">
                                                                <div className={`settings-panel__mode-option ${activeTheme === 'dark' ? "active" : ""}`} onClick={() => changeTheme("dark")}>
                                                                    <div>
                                                                        <span className="settings-panel__mode-title">Đang bật</span>
                                                                    </div>
                                                                    <i className="settings-panel__radio-icon"></i>
                                                                </div>
                                                            </div>
                                                        </label>
                                                        <label className="settings-panel__label">
                                                            <div className="settings-panel__mode-option-wrap">
                                                                <div className={`settings-panel__mode-option ${activeTheme === 'system' ? "active" : ""}`} onClick={() => changeTheme("system")}>
                                                                    <div>
                                                                        <span className="settings-panel__mode-title">Tự động</span>
                                                                        <span className="settings-panel__mode-subtitle">
                                                                            Chúng tôi sẽ tự động điều chỉnh màn hình theo cài đặt hệ thống trên thiết bị của bạn.
                                                                        </span>
                                                                    </div>
                                                                    <i className="settings-panel__radio-icon"></i>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="nav-item">
                                <Link to={'/login'} className="btn btn-sm btn-primary">Đăng nhập</Link>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
}

export default Header;