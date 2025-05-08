import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import nProgress from 'nprogress';
import useDeviceType from './hooks/useDeviceType';
import eventBus from './utils/eventBus';
import { checkTokenExpiration } from './utils/tokenUtils';
import useThemeChange from './hooks/useThemeChange';
import { logout as logoutAction } from './features/userSlice';
import { clearFriendState } from './features/friendSlice';
import { Bounce, toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { addNotification, setUnreadCount } from './features/notificationSlice';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const { user: currentUser, isLoggedIn } = useSelector((state) => state.user);
    const { friendRequests } = useSelector((state) => state.friends);
    const dispatch = useDispatch();
    const deviceType = useDeviceType();
    const { activeTheme, changeTheme } = useThemeChange();

    const [showFriendRequests, setShowFriendRequests] = useState(false);

    // LogOut function
    const logOut = useCallback(() => {
        dispatch(logoutAction());
        dispatch(clearFriendState());
    }, [dispatch]);
    // Kiểm tra token khi ứng dụng khởi động
    useEffect(() => {
        checkTokenExpiration();
    }, []);
    useEffect(() => {
        if (isLoggedIn && currentUser) {
            const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

            const socket = io(SERVER_URL, {
                auth: { token: currentUser.accessToken },
                // transports: ['websocket'] // Ưu tiên WebSocket
            });

            socket.on('newNotification', ({ notification, unreadCount }) => {
                console.log('AppContext: New notification received:', notification);
                toast.info(notification.message, {
                    theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                    transition: Bounce,
                });

                dispatch(addNotification(notification));
                dispatch(setUnreadCount(unreadCount));
            });
            return () => {
                socket.off('newNotification');
                socket.disconnect();
            };
        }
    }, [isLoggedIn, currentUser, logOut, dispatch]);

    // Xử lý logout khi token hết hạn
    useEffect(() => {
        const handleLogout = () => {
            dispatch(logoutAction());
            dispatch(clearFriendState());
        }
        eventBus.on("logout", handleLogout);
        return () => eventBus.remove("logout", handleLogout);
    }, [dispatch]);



    nProgress.configure({ easing: 'ease', speed: 500, showSpinner: false });

    useEffect(() => {
        localStorage.setItem("deviceType", deviceType);
    }, [deviceType]);

    const value = {
        currentUser,
        isLoggedIn,
        logOut,
        showFriendRequests,
        setShowFriendRequests,
        friendRequests: Array.isArray(friendRequests) ? friendRequests : [],
        activeTheme,
        changeTheme,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);