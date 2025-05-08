// pages/Profile.js (Component Cha - Đã sửa đổi)
import React, { useEffect, useState, useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { Bounce, toast } from "react-toastify";

// Import Redux actions
import { updateUser, getUserTimeline } from "../features/userSlice";
import {
    acceptFriendRequest, rejectFriendRequest,
    cancelFriendRequest, removeFriend, getFriends
} from "../features/friendSlice";

// Import Hooks và Components con
import useDropdown from "../hooks/useDropdown";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfileInfoCard from "../components/Profile/ProfileInfoCard";
import SocialLinksCard from "../components/Profile/SocialLinksCard";
import TimelineSection from "../components/Profile/TimelineSection";
import FriendManagementSection from "../components/Profile/FriendManagementSection";


const Profile = () => {
    const { user: currentUser, isLoggedIn } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [infoLoading, setInfoLoading] = useState(false);
    const [profile, setProfile] = useState(null);  
    const [timeline, setTimeline] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentFriendRequests, setSentFriendRequests] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const { openDropdown, toggleDropdown, dropdownRefCallback } = useDropdown();

    // --- Chuyển hướng nếu chưa đăng nhập ---
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        if (currentUser?.name) {
            document.title = `${currentUser.name} - WWAN Film`;
        }
    }, [currentUser?.name]);

    // --- Faster & more efficient way to show toasts ---
    const showSuccessToast = (message) => toast.success(message, { position: "top-right", autoClose: 2000, theme: document.documentElement.getAttribute("data-ww-theme") || "light", transition: Bounce });

    const showErrorToast = (error, prefix = "Lỗi") => {
        const message = error?.message || (typeof error === 'string' ? error : 'Thao tác thất bại. Vui lòng thử lại.');
        console.error(`${prefix} Error:`, error);
        toast.error(`${prefix}: ${message}`, {
            position: "top-right", autoClose: 4000, theme: document.documentElement.getAttribute("data-ww-theme") || "light", transition: Bounce,
        });
        
    };

    // --- Fetch Dữ liệu Ban đầu & Khởi tạo Profile Edit State ---
    useEffect(() => {
        if (isLoggedIn && currentUser?.uuid && currentUser?.id) {
            setProfile({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phoneNumber: currentUser.phoneNumber || '',
                uuid: currentUser.uuid,
                socialLinks: currentUser.socialLinks || { github: '', twitter: '', instagram: '', facebook: '' }
            });

            setLoadingTimeline(true);
            dispatch(getUserTimeline(currentUser.uuid))
                .unwrap()
                .then((timelineData) => setTimeline(timelineData || []))
                .catch(error => showErrorToast(error, 'Lỗi tải dòng thời gian'))
                .finally(() => setLoadingTimeline(false));

            setLoadingFriends(true);
            dispatch(getFriends(currentUser.id))
                .unwrap()
                .then((response) => {
                    setFriends(response?.friends || []);
                    setFriendRequests(response?.friendRequests || []);
                    setSentFriendRequests(response?.sentFriendRequests || []);
                })
                .catch(error => showErrorToast(error, 'Lỗi tải danh sách bạn bè'))
                .finally(() => setLoadingFriends(false));
        } else if (!isLoggedIn) {
            setProfile(null);
            setTimeline([]);
            setFriends([]);
            setFriendRequests([]);
            setSentFriendRequests([]);
        }
    }, [currentUser, isLoggedIn, dispatch]);

    const handleEditToggle = useCallback(() => {
        if (!isEditing && currentUser) {
            // Khi bắt đầu edit, đảm bảo state `profile` đồng bộ với `currentUser` mới nhất
            setProfile({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phoneNumber: currentUser.phoneNumber || '',
                uuid: currentUser.uuid,
                socialLinks: { ...(currentUser.socialLinks || { github: '', twitter: '', instagram: '', facebook: '' }) }
            });
        }
        setIsEditing(prev => !prev);
    }, [isEditing, currentUser]);

    const handleProfileChange = useCallback((e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSocialLinkChange = useCallback((e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [name]: value }
        }));
    }, []);

    const areProfilesEqual = useCallback((profile1, profile2) => {
        if (!profile1 || !profile2) return true;
        return (
            profile1.name === profile2.name &&
            profile1.email === profile2.email &&
            profile1.phoneNumber === profile2.phoneNumber &&
            JSON.stringify(profile1.socialLinks) === JSON.stringify(profile2.socialLinks || {})
        );
    }, []);

    const handleSaveChanges = useCallback(async (e) => {
        e.preventDefault();
        if (!profile || areProfilesEqual(profile, currentUser)) {
            setIsEditing(false);
            return;
        }
        setInfoLoading(true);
        try {
            await dispatch(updateUser(profile)).unwrap();
            showSuccessToast("Cập nhật thông tin thành công!"); // Gọi toast thành công trực tiếp
            setIsEditing(false); // Thoát edit mode sau khi thành công
        } catch (error) {
            showErrorToast(error, "Lỗi cập nhật thông tin"); // Gọi toast lỗi trực tiếp
        } finally {
            setInfoLoading(false);
            // setIsEditing(false); // Đã chuyển vào try nếu thành công, hoặc giữ ở đây nếu luôn muốn thoát edit
        }
    }, [profile, currentUser, areProfilesEqual, dispatch]);

    // --- Xử lý Actions Bạn bè (với Rollback) ---
    // Hàm trợ giúp để cập nhật state cục bộ lạc quan và rollback
    const handleFriendAction = useCallback(async (actionCreator, payload, optimisticUpdate, rollbackUpdate, successMessage, errorMessagePrefix) => {
        const originalState = { friends: [...friends], friendRequests: [...friendRequests], sentFriendRequests: [...sentFriendRequests] };

        optimisticUpdate(); // Cập nhật lạc quan

        try {
            await dispatch(actionCreator(payload)).unwrap();
            showSuccessToast(successMessage);
        } catch (error) {
            rollbackUpdate(originalState);
            showErrorToast(error, errorMessagePrefix);
        }
    }, [dispatch, friends, friendRequests, sentFriendRequests]);

    const handleAcceptFriendRequest = (requesterId) => {
        handleFriendAction(
            acceptFriendRequest,
            requesterId,
            () => {
                // Lấy thông tin người gửi từ state hiện tại để thêm lạc quan (nếu cần)
                const requesterInfo = friendRequests.find(req => req.id === requesterId);
                if (requesterInfo) {
                    setFriends(prev => [...prev, requesterInfo]); // Thêm lạc quan (có thể thiếu info)
                }
                setFriendRequests(prev => prev.filter(req => req.id !== requesterId));
            },
            (original) => {
                setFriends(original.friends);
                setFriendRequests(original.friendRequests);
            },
            "Đã chấp nhận lời mời!", "Lỗi chấp nhận lời mời"
        );
    };

    const handleRejectFriendRequest = (requesterId) => {
        handleFriendAction(
            rejectFriendRequest,
            requesterId,
            () => setFriendRequests(prev => prev.filter(req => req.id !== requesterId)),
            (original) => setFriendRequests(original.friendRequests),
            "Đã từ chối lời mời.", "Lỗi từ chối lời mời"
        );
    };

    const handleCancelFriendRequest = (recipientId) => {
        handleFriendAction(
            cancelFriendRequest,
            recipientId,
            () => setSentFriendRequests(prev => prev.filter(req => req.id !== recipientId)),
            (original) => setSentFriendRequests(original.sentFriendRequests),
            "Đã hủy lời mời.", "Lỗi hủy lời mời"
        );
    };

    const handleRemoveFriend = (friendId) => {
        if (!window.confirm("Bạn chắc chắn muốn hủy kết bạn?")) return;
        handleFriendAction(
            removeFriend,
            friendId,
            () => {
                setFriends(prev => prev.filter(f => f.id !== friendId));
                // Đồng thời bỏ follow nếu đang follow
            },
            (original) => {
                setFriends(original.friends);
            },
            "Đã hủy kết bạn.",
            "Lỗi hủy kết bạn"
        );
    };

    if (!isLoggedIn || !currentUser) {
        return <div className="container text-center p-5"><i className="fas fa-spinner fa-spin fa-3x"></i></div>;
    }

    return (
        <div className="container">
            <div className="main-body">
                <nav aria-label="breadcrumb" className="main-breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><Link to={'/'}>Trang chủ</Link></li>
                        <li className="breadcrumb-item active" aria-current="page">Hồ sơ người dùng</li>
                    </ol>
                </nav>

                <div className="row gutters-sm">
                    {/* Cột trái: Header & Social Links */}
                    <div className="col-md-4 mb-3">
                        <ProfileHeader
                            currentUser={currentUser}
                            profileData={profile} // Truyền profile nếu cần hiển thị động ở header
                            dropdownProps={{ openDropdownId: openDropdown, toggleDropdown, dropdownRefCallback }}
                        />
                        <SocialLinksCard
                            socialLinks={isEditing ? profile?.socialLinks : currentUser?.socialLinks} // Lấy đúng dữ liệu
                            isEditing={isEditing}
                            onSocialLinkChange={handleSocialLinkChange} // Truyền hàm cập nhật state profile
                        />
                        <FriendManagementSection
                            friends={friends}
                            friendRequests={friendRequests}
                            sentFriendRequests={sentFriendRequests}
                            loading={loadingFriends}
                            onAcceptRequest={handleAcceptFriendRequest}
                            onRejectRequest={handleRejectFriendRequest}
                            onCancelRequest={handleCancelFriendRequest}
                            onRemoveFriend={handleRemoveFriend}
                        />
                    </div>

                    {/* Cột phải: Info Card, Timeline, Friends */}
                    <div className="col-md-8">
                        <ProfileInfoCard
                            currentUser={currentUser} // Dữ liệu gốc để hiển thị
                            profileData={profile} // Dữ liệu đang chỉnh sửa
                            isEditing={isEditing}
                            onEditToggle={handleEditToggle} // Truyền hàm bật/tắt edit
                            onProfileChange={handleProfileChange} // Truyền hàm cập nhật state profile
                            onSaveChanges={handleSaveChanges} // Truyền hàm lưu thay đổi
                            isLoading={infoLoading} // Truyền trạng thái loading
                        />
                        <TimelineSection
                            timeline={timeline}
                            loading={loadingTimeline}
                        />
                        
                    </div>
                </div>
            </div>
           
        </div>
    );
};

export default Profile;