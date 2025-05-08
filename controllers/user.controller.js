// controllers/UserController.js (Đã cải tiến)
import bcrypt from 'bcrypt'; // <-- THÊM IMPORT
import { Op, fn, col } from 'sequelize'; // Đảm bảo import đủ
import User from "../models/User.js";
import Role from "../models/Role.js";
import Friend from "../models/Friend.js";
import Genre from '../models/Genre.js';
import Episode from '../models/Episode.js';
import Category from '../models/Category.js';
import Country from '../models/Country.js';
import WatchHistory from '../models/WatchHistory.js';
import Movie from '../models/Movie.js';
import Notification from '../models/Notification.js';
import { getIo } from '../config/socket.js';
import { handleServerError } from "../utils/errorUtils.js";

// --- Hàm Helper Định dạng User Response ---
const formatUserResponse = (user, roles) => ({
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    avatar: user.avatar,
    googleId: user.googleId,
    roles: roles.map(r => r.name),
    createdAt: user.createdAt,
    status: user.status,
    socialLinks: user.socialLinks
});

const getGenrePreferences = async (userId) => {
    const watchHistory = await WatchHistory.findAll({
        where: { userId },
        include: [{
            model: Episode,
            attributes: ['movieId'],
            include: [{
                model: Movie,
                as: 'movie', // Đảm bảo alias này đúng với model Episode
                attributes: ['id'],
                include: [{
                    model: Genre,
                    as: 'genres', // Đảm bảo alias này đúng với model Movie
                    attributes: ['id', 'title'],
                    through: { attributes: [] } // Bỏ qua bảng trung gian nếu là N-M
                }]
            }]
        }]
    });

    const genreCounts = {};
    watchHistory.forEach(historyItem => {
        historyItem.episode?.movie?.genres?.forEach(genre => {
            genreCounts[genre.id] = (genreCounts[genre.id] || 0) + 1;
        });
    });

    // Sắp xếp thể loại theo số lần xem giảm dần
    const sortedGenres = Object.entries(genreCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([id, count]) => ({ id: parseInt(id), count }));

    return sortedGenres; // Trả về mảng [{ id: genreId1, count: X }, { id: genreId2, count: Y }, ...]
};
export default class UserController {
    // Create a new user (Chuẩn hóa lỗi/response)
    async createUser(req, res) {
        try {
            const { name, email, roles: roleNames, phoneNumber, status, password } = req.body; // Đổi tên roles -> roleNames

            // Kiểm tra các trường bắt buộc
            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: 'Tên, email, và mật khẩu là bắt buộc.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                name, email, phoneNumber, status, password: hashedPassword
            });

            let assignedRoles = [];
            if (roleNames && Array.isArray(roleNames) && roleNames.length > 0) {
                // Tìm các Role objects dựa trên tên
                const foundRoles = await Role.findAll({ where: { name: { [Op.in]: roleNames } } });
                if (foundRoles.length !== roleNames.length) {
                    console.warn("Một số role không tìm thấy:", roleNames);
                    // Có thể throw lỗi hoặc chỉ gán những role tìm thấy
                }
                if (foundRoles.length > 0) {
                    await user.setRoles(foundRoles); // Gán trực tiếp Role objects
                    assignedRoles = foundRoles; // Lưu lại để trả về
                } else {
                    // Nếu không tìm thấy role nào hợp lệ, gán role mặc định
                    const defaultRole = await Role.findByPk(3); // Giả sử ID 3 là role USER
                    if (defaultRole) {
                        await user.setRoles([defaultRole]);
                        assignedRoles = [defaultRole];
                    }
                }
            } else {
                // Gán vai trò mặc định (ví dụ: USER - ID 3)
                const defaultRole = await Role.findByPk(3);
                if (defaultRole) {
                    await user.setRoles([defaultRole]);
                    assignedRoles = [defaultRole];
                }
            }

            res.status(201).json({ // Dùng json
                success: true,
                user: formatUserResponse(user, assignedRoles), // Dùng helper
                message: "User created successfully"
            });
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ success: false, message: 'Email đã tồn tại.' });
            }
            handleServerError(res, error, "Tạo người dùng");
        }
    }

    // Get all users (Thêm phân trang, tối ưu response, chuẩn hóa lỗi)
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const limit = parseInt(req.query.limit || '20', 10);
            const offset = (page - 1) * limit;

            const { count, rows } = await User.findAndCountAll({
                attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }, // Loại bỏ các trường nhạy cảm
                include: [
                    {
                        model: Role,
                        as: 'roles', // Đảm bảo alias đúng
                        attributes: ['name'], // Chỉ lấy tên role
                        through: { attributes: [] } // Bỏ qua bảng trung gian
                    },
                ],
                limit: limit,
                offset: offset,
                order: [['createdAt', 'DESC']], // Sắp xếp mặc định
                distinct: true // Cần thiết khi include N-M và phân trang
            });

            const totalPages = Math.ceil(count / limit);

            // Format response trực tiếp từ kết quả, không cần gọi getRoles() lại
            const formattedUsers = rows.map(user => formatUserResponse(user, user.roles || []));

            res.status(200).json({ // Dùng json
                success: true,
                users: formattedUsers,
                pagination: {
                    totalItems: count,
                    totalPages: totalPages,
                    currentPage: page,
                    itemsPerPage: limit
                }
            });
        } catch (error) {
            handleServerError(res, error, "Lấy danh sách người dùng");
        }
    }

    // Get a user by ID (Chuẩn hóa lỗi/response)
    async getUserById(req, res) {
        try {
            const id = req.params.id;
            const user = await User.findByPk(id, {
                attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
                include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }]
            });
            if (!user) {
                return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
            } else {
                res.status(200).json({ success: true, user: formatUserResponse(user, user.roles || []) });
            }
        } catch (error) {
            handleServerError(res, error, `Lấy người dùng ID ${req.params.id}`);
        }
    }

    // Update a user (Tối ưu response, chuẩn hóa lỗi)
    async updateUser(req, res) {
        try {
            const id = req.params.id;
            // Chỉ lấy các trường cho phép cập nhật từ body
            const { name, email, roles: roleNames, phoneNumber, status } = req.body;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            // Cập nhật các trường nếu chúng được cung cấp trong body
            if (name !== undefined) user.name = name;
            if (email !== undefined) user.email = email;
            if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
            if (status !== undefined) user.status = status;

            let updatedRoles = await user.getRoles(); // Lấy roles hiện tại để trả về nếu không có thay đổi roles
            // Cập nhật roles nếu được cung cấp
            if (roleNames && Array.isArray(roleNames)) {
                const foundRoles = await Role.findAll({ where: { name: { [Op.in]: roleNames } } });
                await user.setRoles(foundRoles); // Gán lại roles
                updatedRoles = foundRoles; // Cập nhật roles để trả về
            }

            await user.save(); // Lưu thay đổi

            res.status(200).json({ // Dùng json
                success: true,
                user: formatUserResponse(user, updatedRoles), // Dùng helper và roles đã cập nhật
                message: "User updated successfully"
            });
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ success: false, message: 'Email đã được sử dụng.' });
            }
            handleServerError(res, error, `Cập nhật người dùng ID ${req.params.id}`);
        }
    }

    // Delete a user (Chuẩn hóa lỗi/response)
    async deleteUser(req, res) {
        try {
            const id = req.params.id;
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            } else {
                await user.destroy();
                res.status(200).json({ success: true, message: "User deleted successfully" }); // Dùng json
            }
        } catch (error) {
            handleServerError(res, error, `Xóa người dùng ID ${req.params.id}`);
        }
    }

    // Get user statistics (Chuẩn hóa lỗi/response)
    async getUserStats(req, res) {
        try {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);

            // Dùng Promise.all để chạy song song
            const [dailyStatsRaw, monthlyStatsRaw, statusStatsRaw] = await Promise.all([
                User.findAll({
                    attributes: [[fn('DATE', col('createdAt')), 'date'], [fn('COUNT', col('id')), 'count']],
                    where: { createdAt: { [Op.gte]: lastMonth } },
                    group: [fn('DATE', col('createdAt'))],
                    order: [[fn('DATE', col('createdAt')), 'ASC']],
                    raw: true // Lấy kết quả dạng plain object
                }),
                User.findAll({
                    attributes: [[fn('MONTH', col('createdAt')), 'month'], [fn('COUNT', col('id')), 'count']],
                    where: { createdAt: { [Op.gte]: new Date(new Date().getFullYear(), 0, 1) } },
                    group: [fn('MONTH', col('createdAt'))],
                    order: [[fn('MONTH', col('createdAt')), 'ASC']],
                    raw: true
                }),
                User.findAll({
                    attributes: ['status', [fn('COUNT', col('id')), 'count']],
                    group: ['status'],
                    raw: true
                })
            ]);

            // Format lại cho dễ dùng ở frontend nếu cần
            const formattedMonthly = monthlyStatsRaw.map(s => ({ month: s.month, count: parseInt(s.count, 10) }));
            const formattedStatus = statusStatsRaw.map(s => ({ status: s.status, count: parseInt(s.count, 10) }));
            const formattedDaily = dailyStatsRaw.map(s => ({ date: s.date, count: parseInt(s.count, 10) }));


            res.status(200).json({
                success: true,
                stats: { // Trả về trong key 'stats'
                    daily: formattedDaily,
                    monthly: formattedMonthly,
                    status: formattedStatus
                }
            });
        } catch (error) {
            handleServerError(res, error, "Lấy thống kê người dùng");
        }
    }

    // --- Friend System Methods (Chuẩn hóa lỗi, Fix bảo mật) ---
    async sendFriendRequest(req, res) {
        const requesterId = req.userId; // Lấy ID người gửi từ middleware xác thực
        const { friendId: recipientId } = req.body;

        if (!requesterId || !recipientId) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin userId hoặc friendId." });
        }
        if (requesterId === recipientId) {
            return res.status(400).json({ success: false, message: "Không thể tự gửi lời mời kết bạn." });
        }

        try {
            // Kiểm tra xem đã có mối quan hệ hoặc lời mời nào chưa
            const existingFriendship = await Friend.findOne({
                where: {
                    [Op.or]: [
                        { userId: requesterId, friendId: recipientId },
                        { userId: recipientId, friendId: requesterId }
                    ]
                }
            });

            if (existingFriendship) {
                if (existingFriendship.status === 'accepted') {
                    return res.status(409).json({ success: false, message: "Đã là bạn bè." });
                } else if (existingFriendship.status === 'pending') {
                    // Kiểm tra ai là người gửi
                    if (existingFriendship.userId === requesterId) {
                        return res.status(409).json({ success: false, message: "Đã gửi lời mời trước đó." });
                    } else {
                        return res.status(409).json({ success: false, message: "Người này đã gửi lời mời cho bạn." });
                    }
                }
            }

            await Friend.create({ userId: requesterId, friendId: recipientId, status: 'pending' });

            // --- TẠO THÔNG BÁO ---
            const requester = await User.findByPk(requesterId, { attributes: ['uuid','name'] }); // Lấy tên người gửi
            if (requester) {
                const newNotification = await Notification.create({
                    recipientId: recipientId, // Người nhận thông báo
                    senderId: requesterId,    // Người gửi lời mời
                    type: 'FRIEND_REQUEST',
                    message: `${requester.name} đã gửi cho bạn một lời mời kết bạn.`,
                    link: `/profile/${requester.uuid}` // Link đến profile người gửi (giả sử có uuid)
                });
                
                const io = getIo();
                const recipientRoom = `user_${recipientId}`;
                io.to(recipientRoom).emit('newNotification', { // Emit sự kiện
                    notification: newNotification, // Gửi dữ liệu notification mới
                    unreadCount: await Notification.count({ where: { recipientId, isRead: false }}) // Gửi số lượng chưa đọc
                });
            }
            
            res.status(200).json({ success: true, message: "Đã gửi lời mời kết bạn." });
        } catch (error) {
            handleServerError(res, error, "Gửi lời mời kết bạn");
        }
    }

    async acceptFriendRequest(req, res) {
        const accepterId = req.userId; // Người nhận lời mời (đang đăng nhập)
        const { friendId: requesterId } = req.body; // ID người gửi lời mời từ body (đổi tên cho rõ)

        if (!accepterId || !requesterId) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin.", accepterId, requesterId });
        }

        try {
            // Tìm lời mời mà người gửi là friendId và người nhận là accepterId
            const friendRequest = await Friend.findOne({
                where: { userId: requesterId, friendId: accepterId, status: 'pending' }
            });

            if (friendRequest) {
                friendRequest.status = 'accepted';
                await friendRequest.save();
                // Lấy thông tin người gửi để trả về (nếu cần)
                const friendInfo = await User.findByPk(requesterId, {
                    attributes: ['id', 'name', 'email', 'avatar', 'socialLinks']
                });
                const accepter = await User.findByPk(accepterId, { attributes: ['name'] });
                if (accepter && friendRequest) { // friendRequest từ logic tìm lời mời
                    await Notification.create({
                        recipientId: requesterId, // Người nhận thông báo là người đã gửi lời mời
                        senderId: accepterId,
                        type: 'REQUEST_ACCEPTED', 
                        message: `${accepter.name} đã chấp nhận lời mời kết bạn của bạn.`,
                        link: `/profile/${accepter.uuid}`
                    });
                    // TODO: Emit sự kiện qua Socket.IO đến requesterId
                    const io = getIo();
                    const requesterRoom = `user_${requesterId}`;
                    io.to(requesterRoom).emit('friendRequestAccepted', { // Emit sự kiện
                        notification: { // Gửi dữ liệu notification mới
                            recipientId: requesterId,
                            senderId: accepterId,
                            type: 'REQUEST_ACCEPTED',
                            message: `${accepter.name} đã chấp nhận lời mời kết bạn của bạn.`,
                            link: `/profile/${accepter.uuid}`
                        },
                        unreadCount: await Notification.count({ where: { recipientId: requesterId, isRead: false }}) // Gửi số lượng chưa đọc
                    });
                }
                res.status(200).json({ success: true, message: "Đã chấp nhận lời mời.", friend: friendInfo });
            } else {
                res.status(404).json({ success: false, message: "Không tìm thấy lời mời kết bạn." });
            }
        } catch (error) {
            handleServerError(res, error, "Chấp nhận lời mời kết bạn");
        }
    }

    async rejectFriendRequest(req, res) {
        const currentUserId = req.userId;
        const { friendId } = req.body;

        if (!currentUserId || !friendId) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin." });
        }

        try {
            // Xóa lời mời mà người gửi là friendId và người nhận là currentUserId
            const deletedCount = await Friend.destroy({
                where: { userId: friendId, friendId: currentUserId, status: 'pending' }
            });
            if (deletedCount > 0) {
                res.status(200).json({ success: true, message: "Đã từ chối lời mời." });
            } else {
                res.status(404).json({ success: false, message: "Không tìm thấy lời mời để từ chối." });
            }
        } catch (error) {
            handleServerError(res, error, "Từ chối lời mời kết bạn");
        }
    }

    async cancelFriendRequest(req, res) {
        const currentUserId = req.userId; // Người gửi (đang đăng nhập)
        const { friendId } = req.body; // Người nhận từ body

        if (!currentUserId || !friendId) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin." });
        }

        try {
            // Hủy lời mời mà currentUserId đã gửi cho friendId
            const deletedCount = await Friend.destroy({
                where: { userId: currentUserId, friendId: friendId, status: 'pending' }
            });
            if (deletedCount > 0) {
                res.status(200).json({ success: true, message: "Đã hủy lời mời kết bạn." });
            } else {
                res.status(404).json({ success: false, message: "Không tìm thấy lời mời để hủy." });
            }
        } catch (error) {
            handleServerError(res, error, "Hủy lời mời kết bạn");
        }
    }

    async removeFriend(req, res) {
        const currentUserId = req.userId;
        const { friendId } = req.body; // ID của người muốn hủy kết bạn

        if (!currentUserId || !friendId) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin." });
        }

        try {
            // Xóa bản ghi friend bất kể ai là userId hay friendId
            const deletedCount = await Friend.destroy({
                where: {
                    status: 'accepted', // Chỉ xóa bạn bè đã accepted
                    [Op.or]: [
                        { userId: currentUserId, friendId: friendId },
                        { userId: friendId, friendId: currentUserId }
                    ]
                }
            });
            if (deletedCount > 0) {
                res.status(200).json({ success: true, message: "Đã hủy kết bạn thành công." });
            } else {
                res.status(404).json({ success: false, message: "Không tìm thấy mối quan hệ bạn bè này." });
            }
        } catch (error) {
            handleServerError(res, error, "Hủy kết bạn");
        }
    }

    // getFriends (Chuẩn hóa lỗi, tối ưu map)
    async getFriends(req, res) {
        // Lấy ID của user đang xem profile (có thể là chính mình hoặc người khác)
        const targetUserId = parseInt(req.params.userId, 10); // Lấy từ params
        const currentUserId = req.userId; // Lấy từ người dùng đang đăng nhập (nếu có)

        if (isNaN(targetUserId)) {
            return res.status(400).json({ success: false, message: "UserID không hợp lệ." });
        }

        try {
            // Lấy danh sách bạn bè (accepted)
            const friendships = await Friend.findAll({
                where: {
                    status: 'accepted',
                    [Op.or]: [{ userId: targetUserId }, { friendId: targetUserId }]
                },
                include: [
                    { model: User, as: 'user', attributes: ['id', 'name', 'email', 'socialLinks', 'avatar'] },
                    { model: User, as: 'friend', attributes: ['id', 'name', 'email', 'socialLinks', 'avatar'] }
                ]
            });

            // Lấy lời mời đã nhận (chỉ khi xem profile của chính mình)
            const friendRequestsData = (currentUserId === targetUserId) ? await Friend.findAll({
                where: { friendId: currentUserId, status: 'pending' },
                include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }]
            }) : [];

            // Lấy lời mời đã gửi (chỉ khi xem profile của chính mình)
            const sentFriendRequestsData = (currentUserId === targetUserId) ? await Friend.findAll({
                where: { userId: currentUserId, status: 'pending' },
                include: [{ model: User, as: 'friend', attributes: ['id', 'name', 'email', 'avatar'] }]
            }) : [];

            // Map dữ liệu trả về
            const friendsList = friendships.map(fr => fr.userId === targetUserId ? fr.friend : fr.user);
            const friendRequestsList = friendRequestsData.map(fr => fr.user);
            const sentFriendRequestsList = sentFriendRequestsData.map(fr => fr.friend);

            res.status(200).json({ // Dùng json
                success: true,
                data: { // Đưa vào key 'data'
                    friends: friendsList,
                    friendRequests: friendRequestsList,
                    sentFriendRequests: sentFriendRequestsList,
                }
            });
        } catch (error) {
            handleServerError(res, error, "Lấy dữ liệu bạn bè");
        }
    }

    async getMovieRecommendations(req, res) {
        const userId = req.userId;
        const limit = parseInt(req.query.limit || '10', 10); // Số lượng phim đề xuất

        try {
            const genrePreferences = await getGenrePreferences(userId);

            if (genrePreferences.length === 0) {
                // Nếu không có lịch sử xem, đề xuất phim mới nhất hoặc phổ biến chung
                const popularMovies = await Movie.findAll({
                    order: [['views', 'DESC']], // Ví dụ: phổ biến theo views
                    limit: limit,
                    include: [ /* ... các include cần thiết cho card phim ... */
                        { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'], through: {attributes: []}},
                        { model: Episode, as: 'Episodes', attributes: ['id', 'episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1}
                    ]
                });
                return res.status(200).json({ success: true, recommendations: popularMovies, message: "Phim phổ biến" });
            }

            // Lấy top N thể loại ưa thích (ví dụ: top 3)
            const topGenreIds = genrePreferences.slice(0, 3).map(g => g.id);

            // Lấy ID các phim đã xem để loại trừ
            const watchedMovieIds = (await WatchHistory.findAll({
                where: { userId },
                include: [{ model: Episode, as: 'episode', attributes: ['movieId'] }]
            })).map(wh => wh.episode?.movieId).filter(id => id != null);

            // Tìm phim thuộc các thể loại ưa thích, chưa xem, sắp xếp theo tiêu chí (ví dụ: mới nhất)
            const recommendedMovies = await Movie.findAll({
                include: [
                    {
                        model: Genre,
                        as: 'genres',
                        attributes: ['id', 'title', 'slug'],
                        where: { id: { [Op.in]: topGenreIds } },
                        through: { attributes: [] },
                        required: true // Chỉ lấy phim có ít nhất 1 trong các thể loại này
                    },
                    // Các include khác cần cho hiển thị card phim
                     { model: Episode, as: 'Episodes', attributes: ['id', 'episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1},
                     { model: Category, as: 'categories', attributes: ['id', 'title'] },
                     { model: Country, as: 'countries', attributes: ['id', 'title'] }
                ],
                where: {
                    id: { [Op.notIn]: watchedMovieIds } // Loại trừ phim đã xem
                },
                order: [
                    ['createdAt', 'DESC'], // Ưu tiên phim mới nhất
                    ['views', 'DESC']      // Sau đó là phim nhiều view
                ],
                limit: limit,
                distinct: true, // Cần thiết khi include many-to-many và limit
                subQuery: false // Có thể cần cho limit/offset với include phức tạp
            });

            res.status(200).json({ success: true, recommendations: recommendedMovies });

        } catch (error) {
            handleServerError(res, error, "Lấy phim đề xuất");
        }
    }
}