import db from '../models/index.js';
const WatchHistory = db.WatchHistory;
const Episode = db.Episode;
const Movie = db.Movie;
const User = db.User;

const WATCH_HISTORY_LIMIT = 500;

export const addWatchHistory = async (req, res) => {
    const { userId, episodeId, watchedDuration } = req.body;

    try {
        if (!userId || !episodeId || watchedDuration === undefined) {
            return res.status(400).json({ message: 'Missing required fields (userId, episodeId, watchedDuration).' });
        }
        // Tìm user để cập nhật điểm và level
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // // Tìm lịch sử xem hiện tại của người dùng cho episode này
        // const existingHistory = await WatchHistory.findOne({
        //     where: { userId, episodeId },
        // });

        // if (existingHistory) {
        //     // Cập nhật lại thời gian xem và trả về kết quả
        //     existingHistory.watchedAt = new Date();
        //     await existingHistory.save();
        //     return res.status(200).json(existingHistory);
        // }

        // // Tạo bản ghi mới cho lịch sử xem
        // const newWatchHistory = await WatchHistory.create({
        //     userId,
        //     episodeId,
        //     watchedDuration,
        //     watchedAt: new Date(),
        // });

        // Tìm hoặc tạo lịch sử xem
        const [watchHistory, created] = await WatchHistory.findOrCreate({
            where: { userId, episodeId },
            defaults: {
                userId,
                episodeId,
                watchedDuration: 0, // Khởi tạo là 0 nếu tạo mới
                watchedAt: new Date(),
            }
        });

        if (!created) {
            watchHistory.watchedDuration = Math.floor(watchedDuration); // Cập nhật duration
            watchHistory.watchedAt = new Date(); // Cập nhật thời gian xem cuối
            await watchHistory.save();
            console.log(`Updated watch history for userId: ${userId}, episodeId: ${episodeId}`);
        } else {
             console.log(`Created new watch history for userId: ${userId}, episodeId: ${episodeId}`);
            // Kiểm tra và xóa lịch sử cũ nếu vượt quá giới hạn KHI TẠO MỚI
            const historyCount = await WatchHistory.count({ where: { userId } });
            if (historyCount > WATCH_HISTORY_LIMIT) {
                const excessHistories = await WatchHistory.findAll({
                    where: { userId },
                    order: [['watchedAt', 'ASC']],
                    limit: historyCount - WATCH_HISTORY_LIMIT,
                    attributes: ['id'] // Chỉ cần lấy ID để xóa
                });

                if (excessHistories.length > 0) {
                    await WatchHistory.destroy({
                        where: { id: excessHistories.map((h) => h.id) },
                    });
                    console.log(`Removed ${excessHistories.length} oldest watch history records for userId: ${userId}`);
                }
            }
        }

        return res.status(204).send(watchHistory);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Lấy tất cả lịch sử xem của người dùng
 * @param {Object} req - Đối tượng yêu cầu
 * @param {Object} res - Đối tượng phản hồi
 */
export const getAllWatchHistories = async (req, res) => {
    const { userId } = req.params;

    try {
        const watchHistories = await WatchHistory.findAll({
            where: { userId },
            order: [['watchedAt', 'DESC']],
            include: [
                { model: Episode, include: {
                    model: Movie, as: 'movie'
                }}
            ]
        });

        return res.status(200).json(watchHistories);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Xóa lịch sử xem của người dùng
 * @param {Object} req - Đối tượng yêu cầu
 * @param {Object} res - Đối tượng phản hồi
 */
export const deleteWatchHistory = async (req, res) => {
    const { userId, episodeId } = req.params;

    try {
        const watchHistory = await WatchHistory.findOne({
            where: { userId, episodeId },
        });

        if (!watchHistory) {
            return res.status(404).json({ message: 'Lịch sử xem không tồn tại' });
        }

        await watchHistory.destroy();

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};