import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import NProgress from 'nprogress';
import { useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Bounce, toast } from 'react-toastify';
import axios from 'axios';
import authHeader from '../services/auth-header';
import VideoDetail from '../components/VideoDetail';
import classNames from '../utils/classNames';
import useDeviceType from '../hooks/useDeviceType';
import VideoPlaySideBar from '../components/VideoPlaySidebar';
import VideoPlayer from '../components/VideoPlayer';
import "../assets/scss/play-movie.scss";
import VideoPlayComments from '../components/VideoPlayComments';

const VideoContext = createContext();

const initialState = {
    data: {},
    loading: true,
    error: null,
    isFavorited: false,
    isFollowed: false,
    totalFavoritesByEpisode: 0,
    totalFavorites: 0,
    favLoading: false,
    followLoading: false,
    selectedGroupIndex: 0,
    cardWidth: 0,
    isDragging: false,
    canScrollLeft: false,
    canScrollRight: true,
    visibleSeriesCount: 3,
    watchedEpisodes: [],
};

function reducer(state, action) {
    switch (action.type) {
        case 'FETCH_SUCCESS':
            return {
                ...state,
                data: action.payload,
                isFavorited: action.payload.isFavorite,
                isFollowed: action.payload.isFollow,
                totalFavorites: action.payload.totalFavorites,
                totalFavoritesByEpisode: action.payload.totalFavoritesByEpisode,
                loading: false, error: null
            };
        case 'FETCH_ERROR':
            return { ...state, error: action.payload, loading: false };
        // --- Actions cho Cập nhật Lạc quan ---
        case 'TOGGLE_FAVORITE_OPTIMISTIC': { // Đổi tên action cho rõ ràng
            const newIsFavorited = !state.isFavorited;
            const newTotalFavorites = state.totalFavoritesByEpisode + (newIsFavorited ? 1 : -1);
            return {
                ...state,
                isFavorited: newIsFavorited,
                // Đảm bảo count không âm
                totalFavoritesByEpisode: Math.max(0, newTotalFavorites),
                favLoading: true // Bắt đầu loading khi thực hiện lạc quan
            };
        }
        case 'TOGGLE_FOLLOW_OPTIMISTIC': { // Đổi tên action cho rõ ràng
            const newIsFollowed = !state.isFollowed;
            return {
                ...state,
                isFollowed: newIsFollowed,
                followLoading: true // Bắt đầu loading
            };
        }
        // --- Actions cho Rollback khi API lỗi ---
        case 'ROLLBACK_FAVORITE_TOGGLE':
            return {
                ...state,
                isFavorited: action.payload.originalIsFavorited,
                totalFavoritesByEpisode: action.payload.originalTotalFavorites,
                favLoading: false // Kết thúc loading khi rollback
            };
        case 'ROLLBACK_FOLLOW_TOGGLE':
            return {
                ...state,
                isFollowed: action.payload.originalIsFollowed,
                followLoading: false // Kết thúc loading khi rollback
            };
        case 'TOGGLE_FAVORITE':
            return {
                ...state,
                isFavorited: action.payload?.isFavorited ?? state.isFavorited,
                totalFavoritesByEpisode: action.payload?.totalFavoritesByEpisode ?? state.totalFavoritesByEpisode,
                favLoading: false
            };
        case 'TOGGLE_FOLLOW':
            return { ...state, isFollowed: action.payload, followLoading: false };
        case 'SET_FAV_LOADING':
            return { ...state, favLoading: action.payload };
        case 'SET_FOLLOW_LOADING':
            return { ...state, followLoading: action.payload };
        case 'SET_SELECTED_GROUP_INDEX':
            return { ...state, selectedGroupIndex: action.payload };
        case 'SET_CARD_WIDTH':
            return { ...state, cardWidth: action.payload };
        case 'SET_IS_DRAGGING':
            return { ...state, isDragging: action.payload };
        case 'SET_CAN_SCROLL_LEFT':
            return { ...state, canScrollLeft: action.payload };
        case 'SET_CAN_SCROLL_RIGHT':
            return { ...state, canScrollRight: action.payload };
        case 'SET_VISIBLE_SERIES_COUNT':
            return { ...state, visibleSeriesCount: action.payload };
        case 'SET_WATCHED_EPISODES':
            return { ...state, watchedEpisodes: action.payload };
        default:
            return state;
    }
}

const PlayVideoProvider = ({ children, slug, episodeNumber }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { user: currentUser } = useSelector((state) => state.user);

    // --- Hàm xử lý lỗi API chung --- (Cần được định nghĩa ở đây hoặc import)
    const handleApiError = useCallback((error, operation = "thực hiện") => {
        console.error(`Failed to ${operation}:`, error);
        let message = `Thao tác ${operation} thất bại. Vui lòng thử lại.`;
        if (error.response?.data?.message) {
            message = error.response.data.message;
        } else if (error.message) {
            message = error.message;
        }
        toast.error(message, {
            position: "top-right",
            autoClose: 4000,
            theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce,
        });
    }, []);

    useEffect(() => {
        const getData = async () => {
            // Reset state trước khi fetch mới (quan trọng khi chuyển tập)
            dispatch({ type: 'SET_FAV_LOADING', payload: true });
            dispatch({ type: 'SET_FOLLOW_LOADING', payload: true });
            NProgress.start();
            try {
                const response = await axios.get(`/api/video-play/${slug}?t=${episodeNumber}`, { headers: authHeader() });
                dispatch({ type: 'FETCH_SUCCESS', payload: response.data });
            } catch (err) {
                // Sử dụng handleApiError
                handleApiError(err, `tải dữ liệu video ${slug} tập ${episodeNumber}`);
                dispatch({ type: 'FETCH_ERROR', payload: err.message });
            } finally {
                NProgress.done();
                dispatch({ type: 'SET_FAV_LOADING', payload: false });
                // Reset loading riêng của nút (nếu cần)
                dispatch({ type: 'SET_FOLLOW_LOADING', payload: false });
            }
        };
        // Chỉ fetch khi có slug và episodeNumber
        if (slug && episodeNumber) {
            getData();
        } else {
            // Xử lý trường hợp thiếu slug/episodeNumber nếu cần
            console.warn("Slug or episodeNumber is missing.");
            dispatch({ type: 'FETCH_ERROR', payload: 'Missing slug or episode number' });
        }
    }, [slug, episodeNumber, handleApiError]);

    // --- Lưu lịch sử xem ---
    useEffect(() => {
        // Hàm save tách biệt
        const saveWatchHistory = async (userId, episodeId) => {
            try {
                await axios.post('/api/watch-history', { userId, episodeId, watchedDuration: 0 }, { headers: authHeader() });
                console.log("Watch history saved for episode:", episodeId);
            } catch (error) {
                console.error("Error saving watch history:", error);
                handleApiError(error, "lưu lịch sử xem");
            }
        };

        // Chỉ lưu khi có đủ thông tin và data không còn loading
        if (currentUser && state.data?.episode?.id && !state.loading) {
            saveWatchHistory(currentUser.id, state.data.episode.id);
        }
    }, [currentUser, state.data?.episode?.id, state.loading]);

    const handleFavoriteToggle = useCallback( async () => {
        if (!currentUser) {
            showToast("Vui lòng đăng nhập để yêu thích.");
            return;
        }
        if (state.favLoading || !state.data?.episode?.id || !state.data?.movie?.id) return; // Kiểm tra data cần thiết

        const { id: userId } = currentUser;
        const { id: episodeId } = state.data.episode;
        const { id: movieId } = state.data.movie;

        // Lưu trạng thái gốc
        const originalIsFavorited = state.isFavorited;
        const originalTotalFavorites = state.totalFavoritesByEpisode;

        dispatch({ type: 'TOGGLE_FAVORITE_OPTIMISTIC' });

        try {
            if (originalIsFavorited) { // Nếu trước đó đã thích -> bỏ thích
                await axios.delete('/api/favorites', { data: { userId, episodeId }, headers: authHeader() });
                // API thành công, state lạc quan đã đúng, có thể dispatch SUCCESS nếu cần cập nhật count chính xác
                // Ví dụ: dispatch({ type: 'UPDATE_FAVORITE_COUNT', payload: response.data.newCount });
                // Hoặc nếu không cần count chính xác ngay:
                dispatch({ type: 'SET_FAV_LOADING', payload: false }); // Chỉ cần tắt loading
                toast.success("Đã xóa khỏi danh sách yêu thích"); // Thêm toast xóa

            } else { // Nếu trước đó chưa thích -> thích
                await axios.post('/api/favorites', { userId, episodeId, movieId }, { headers: authHeader() });
                // API thành công, state lạc quan đã đúng, có thể dispatch SUCCESS nếu cần
                // Ví dụ: dispatch({ type: 'UPDATE_FAVORITE_COUNT', payload: response.data.newCount });
                // Hoặc:
                dispatch({ type: 'SET_FAV_LOADING', payload: false });
                toast.success("Đã thêm vào danh sách yêu thích");
            }
        } catch (error) {
            handleApiError(error, originalIsFavorited ? "xóa yêu thích" : "thêm yêu thích");
            dispatch({
                type: 'ROLLBACK_FAVORITE_TOGGLE',
                payload: { originalIsFavorited, originalTotalFavorites }
            });
        }
    }, [state.favLoading, currentUser, state.data.episode, state.data.movie, state.isFavorited, state.totalFavoritesByEpisode, handleApiError]);

    const handleFollowToggle = useCallback( async () => {
        if (!currentUser) {
            showToast("Vui lòng đăng nhập.");
            return;
        }
        if (state.followLoading) return;

        const { id: userId } = currentUser;
        const { id: movieId } = state.data.movie;

        // Lưu trạng thái gốc
        const originalIsFollowed = state.isFollowed;
        dispatch({ type: 'TOGGLE_FOLLOW_OPTIMISTIC' });

        try {
            let response;
            if (originalIsFollowed) { // Đã follow -> unfollow
                response = await axios.delete('/api/follow-movie/delete', { data: { userId, movieId }, headers: authHeader() });
                // Cập nhật state chính xác từ server nếu cần
                dispatch({ type: 'UPDATE_FOLLOW_STATUS', payload: false });
                toast.success(response.data?.message || "Đã bỏ theo dõi phim.");
            } else { // Chưa follow -> follow
                response = await axios.post('/api/follow-movie', { userId, movieId }, { headers: authHeader() });
               // Cập nhật state chính xác từ server nếu cần
                dispatch({ type: 'UPDATE_FOLLOW_STATUS', payload: true }); // Hoặc payload: response.data.isFollowed
                toast.success(response.data?.message || "Đã theo dõi phim.");
            }
        } catch (error) {
            handleApiError(error, originalIsFollowed ? "bỏ theo dõi" : "theo dõi");
            // --- Rollback State ---
            dispatch({
                type: 'ROLLBACK_FOLLOW_TOGGLE',
                payload: { originalIsFollowed }
            });
        }
    }, [state.followLoading, currentUser, state.data.movie, state.isFollowed, handleApiError]);

    const showToast = (message) => {
        toast.info(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: localStorage.getItem("theme"),
            transition: Bounce,
        });
    };
    // --- Cung cấp giá trị cho Context ---
    // Memoize context value để tránh re-render không cần thiết
    const contextValue = useMemo(() => ({
        state,
        dispatch,
        episodeNumber,
        slug,
        handleFavoriteToggle,
        handleFollowToggle
    }), [state, dispatch, episodeNumber, slug, handleFavoriteToggle, handleFollowToggle]);

    return (
        <VideoContext.Provider value={contextValue}>
            {children}
        </VideoContext.Provider>
    );
};

export const PlayMovie = () => {

    const location = useLocation();
    const { slug } = useParams();
    const params = new URLSearchParams(location.search);
    const episodeNumber = params.get('t');

    return (
        <PlayVideoProvider slug={slug} episodeNumber={episodeNumber} >
            <VideoPlay />
        </PlayVideoProvider>
    );
};

const VideoPlay = () => {
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);
    const { state } = useVideo();

    useEffect(() => {
            if (state.data?.movie?.title) {
                document.title = `${state.data.movie.title} - WWAN Film`;
            } else if (!state.loading) {
                 document.title = 'Không tìm thấy phim - WWAN Film';
            }
        }, [state.data?.movie?.title, state.loading]);
    if (state.loading) {
        return (
            <div className="loader-overlay">
                <div className="loader"></div>
                <p>Đang tải...</p>
            </div>
        );
    };
    return (
        <div className='container'>
            <section className={classNames("page-single video-play", { 'video-play--mobile': isMobile })}>
                <VideoPlayer />
                <VideoDetail />
                <VideoPlaySideBar />
                <VideoPlayComments />
            </section>
        </div>
    )
};

export const useVideo = () => useContext(VideoContext);