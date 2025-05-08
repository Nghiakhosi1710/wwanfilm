// models/index.js
import sequelize from '../config/database.js'; // Import instance sequelize

// Import tất cả models
import User from './User.js';
import Role from './Role.js';
import Comment from './Comment.js';
import WatchHistory from './WatchHistory.js';
import CommentReport from './CommentReport.js';
import FollowMovie from './FollowMovie.js';
import Favorite from './Favorite.js';
import Friend from './Friend.js';
import Movie from './Movie.js';
import Notification from './Notification.js';
import Episode from './Episode.js';
import Section from './Section.js';
import Series from './Series.js';
import Category from './Category.js';
import Country from './Country.js';
import Genre from './Genre.js';
import Rating from './Rating.js';
import { Sequelize } from 'sequelize';

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = User;
db.Role = Role;
db.Comment = Comment;
db.WatchHistory = WatchHistory;
db.CommentReport = CommentReport;
db.FollowMovie = FollowMovie;
db.Favorite = Favorite;
db.Friend = Friend;
db.Notification = Notification;
db.Movie = Movie;
db.Episode = Episode;
db.Section = Section;
db.Series = Series;
db.Category = Category;
db.Country = Country;
db.Genre = Genre;
db.Rating = Rating;
// --- Định nghĩa Associations tập trung ---

// User <-> Role
Role.belongsToMany(User, { through: "user_roles", foreignKey: 'roleId', otherKey: 'userId' });
User.belongsToMany(Role, { through: "user_roles", foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });

// User <-> Comment
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// Thêm các association khác của Comment nếu có (ví dụ với Episode)
Comment.belongsTo(Episode, { foreignKey: 'episodeId', as: 'episode' });
Episode.hasMany(Comment, { foreignKey: 'episodeId', as: 'comments' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId' });
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });

// User <-> WatchHistory
User.hasMany(WatchHistory, { foreignKey: 'userId' });
WatchHistory.belongsTo(User, { foreignKey: 'userId' });
// Thêm association của WatchHistory với Episode
Episode.hasMany(WatchHistory, { foreignKey: 'episodeId' });
WatchHistory.belongsTo(Episode, { foreignKey: 'episodeId' });

// User <-> CommentReport
User.hasMany(CommentReport, { foreignKey: 'userId' });
CommentReport.belongsTo(User, { foreignKey: 'userId' });
// Thêm association của CommentReport với Comment
Comment.hasMany(CommentReport, { foreignKey: 'commentId' });
CommentReport.belongsTo(Comment, { foreignKey: 'commentId' });

// User <-> FollowMovie
User.hasMany(FollowMovie, { foreignKey: 'userId' });
FollowMovie.belongsTo(User, { foreignKey: 'userId' });
Movie.hasMany(FollowMovie, { foreignKey: 'movieId', as: 'follow_movies' });
FollowMovie.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });
// User <-> Favorite
User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId' });
Episode.hasMany(Favorite, { foreignKey: 'episodeId', as: 'favoritedBy' });
Favorite.belongsTo(Episode, { foreignKey: 'episodeId' });
Movie.hasMany(Favorite, { foreignKey: 'movieId' });
Favorite.belongsTo(Movie, { foreignKey: 'movieId' });

// User <-> User (Friendship)
User.belongsToMany(User, {
    as: 'Friends',
    through: Friend,
    foreignKey: 'userId',
    otherKey: 'friendId'
});
User.belongsToMany(User, {
    as: 'FriendOf',
    through: Friend,
    foreignKey: 'friendId',
    otherKey: 'userId'
});
User.hasMany(Friend, { foreignKey: 'userId', as: 'initiatedFriendships' });
User.hasMany(Friend, { foreignKey: 'friendId', as: 'receivedFriendships' });
Friend.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Friend.belongsTo(User, { as: 'friend', foreignKey: 'friendId' });

User.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Genre.belongsToMany(Movie, { through: 'movie_genres' });
Movie.belongsToMany(Genre, { through: 'movie_genres' });
Country.hasMany(Movie, { foreignKey: 'countryId' });
Movie.belongsTo(Country, { foreignKey: 'countryId', as: 'countries' });
Category.hasMany(Movie, { foreignKey: 'categoryId' });
Movie.belongsTo(Category, { foreignKey: 'categoryId', as: 'categories' });

Movie.hasMany(Episode, { foreignKey: 'movieId' });
Episode.belongsTo(Movie, { foreignKey: 'movieId' });

Movie.hasOne(Section, { foreignKey: 'movieId', as: 'sections' });
Section.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });

Series.hasMany(Movie, { foreignKey: "seriesId", as: "movies" });
Movie.belongsTo(Series, { foreignKey: 'seriesId', as: 'series' });

// Movie <-> Rating
Movie.hasMany(Rating, { foreignKey: 'movieId', as: 'ratings' }); // Movie có nhiều ratings
Rating.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' })
// User <-> Rating
User.hasMany(Rating, { foreignKey: 'userId', as: 'ratings' }); // User có nhiều ratings
Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' }); // Rating thuộc về 1 User


export default db;