import { useCallback, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppProvider, useAppContext } from "./AppContext";
import "./assets/scss/core.css";
import "./assets/scss/style.css";
import "./assets/scss/card-section.scss";
import "./assets/scss/video-card.scss";
import "./assets/scss/avatar.scss";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { ToastContainer } from "react-toastify";
import classNames from "./utils/classNames";
import FriendRequestsModal from "./components/Friend/FriendRequestsModal";


const RootApp = () => {
    const { showFriendRequests, setShowFriendRequests } = useAppContext();
    const location = useLocation();
    const isAlbumPage = useMemo(() => location.pathname.includes('/album'), [location.pathname]);
    const isPlayPage = useMemo(() => location.pathname.includes('/play'), [location.pathname]);

    return (
        <>
            <Header />
            <main className={classNames("main-content", {
                'album-page': isAlbumPage,
                'play-page': isPlayPage
            })}>
                <Outlet />
            </main>
            <Footer />
            <FriendRequestsModal isOpen={showFriendRequests} onClose={() => setShowFriendRequests(false)}/>
            <ToastContainer />
        </>
    )
}
const AppWithProvider = () => (
    <AppProvider>
        <RootApp />
    </AppProvider>
);

export default AppWithProvider;