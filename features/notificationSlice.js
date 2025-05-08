// src/features/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authHeader from '../services/auth-header';

const API_URL = '/api/notifications';

// Thunk lấy thông báo chưa đọc (có phân trang)
export const fetchUnreadNotifications = createAsyncThunk(
    "notifications/fetchUnread",
    async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_URL, { params: { page, limit }, headers: authHeader() });
            if (response.data?.success) return response.data;
            return rejectWithValue(response.data?.message);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Thunk đánh dấu đã đọc
export const markAsRead = createAsyncThunk(
    "notifications/markAsRead",
    async (notificationId, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/${notificationId}/read`, {}, { headers: authHeader() });
            if (response.data?.success) {
                 // Dispatch action đồng bộ để cập nhật isRead trong state
                 dispatch(notificationMarkedRead(notificationId));
                return { notificationId, ...response.data };
            }
            return rejectWithValue(response.data?.message);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Thunk đánh dấu tất cả đã đọc
export const markAllAsRead = createAsyncThunk(
    "notifications/markAllAsRead",
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/read-all`, {}, { headers: authHeader() });
            if (response.data?.success) {
                 dispatch(allNotificationsMarkedRead());
                return response.data;
            }
            return rejectWithValue(response.data?.message);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);


const initialState = {
    notifications: [], // Danh sách thông báo hiển thị trong dropdown
    pagination: { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 },
    unreadCount: 0, // Số thông báo chưa đọc (chỉ để hiển thị badge)
    loading: false,
    error: null,
};

const notificationSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        // Action này được gọi từ listener socket trong AppContext
        addNotification: (state, action) => {
            const newNotification = action.payload;
            // Thêm vào đầu danh sách và đảm bảo không trùng lặp (nếu cần)
            if (!state.notifications.some(n => n.id === newNotification.id)) {
                state.notifications.unshift(newNotification);
                // Giới hạn số lượng thông báo trong state nếu cần (ví dụ 50)
                if (state.notifications.length > 50) {
                    state.notifications.pop();
                }
            }
        },
        setUnreadCount: (state, action) => {
            state.unreadCount = action.payload;
        },
        // Actions đồng bộ để cập nhật state khi đánh dấu đã đọc
        notificationMarkedRead: (state, action) => {
            const notificationId = action.payload;
            const index = state.notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                state.notifications[index].isRead = true;
            }
             // Giảm unreadCount nếu notification đó chưa đọc
            if (state.unreadCount > 0) state.unreadCount--;
        },
        allNotificationsMarkedRead: (state) => {
            state.notifications.forEach(n => n.isRead = true);
            state.unreadCount = 0;
        },
        clearNotificationState: () => initialState, // Khi logout
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUnreadNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
                state.loading = false;
                const { notifications, pagination } = action.payload;
                 // Nối thêm hoặc thay thế tùy theo logic phân trang
                 if (pagination.currentPage === 1) {
                    state.notifications = notifications || [];
                 } else {
                     const existingIds = new Set(state.notifications.map(n => n.id));
                     const newNotifs = (notifications || []).filter(n => !existingIds.has(n.id));
                    state.notifications.push(...newNotifs);
                 }
                state.pagination = pagination || initialState.pagination;
                 // Cập nhật unreadCount dựa trên totalItems của thông báo chưa đọc
                 state.unreadCount = pagination.totalItems || 0;
            })
            .addCase(fetchUnreadNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(markAsRead.rejected, (state, action) => {
                 // Xử lý lỗi khi đánh dấu đã đọc (ví dụ hiển thị toast)
                 console.error("Failed to mark notification as read:", action.payload);
                 state.error = action.payload; // Có thể lưu lỗi
            })
            .addCase(markAllAsRead.rejected, (state, action) => {
                console.error("Failed to mark all notifications as read:", action.payload);
                state.error = action.payload;
            });
    }
});

export const {
    addNotification,
    setUnreadCount,
    notificationMarkedRead,
    allNotificationsMarkedRead,
    clearNotificationState
} = notificationSlice.actions;
export default notificationSlice.reducer;