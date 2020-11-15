const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');

// Express + body parser
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Use cors
const cors = require('cors');
// Use env file
require('custom-env').env();
// Use passport
const JWT = require('./utilities/JWT');

// Fix CORS
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Use passport
app.use(JWT.passport.initialize());

// Routers
const indexRouter = require('./routes/index');
const boardsRouter = require('./routes/boards');
const usersRouter = require('./routes/users');
const tagTypeRouter = require('./routes/tag_types');
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/boards', JWT.passport.authenticate('jwt', { session: false }), boardsRouter);
app.use('/tagtypes', tagTypeRouter);

// Database check
const sequelize = require('./configs/sequelize');
sequelize.authenticate()
  .then((err) => {
      console.log('Connection has been established successfully.');
      const User = require('./models/User');
      const Board = require('./models/Board');
      const TagType = require('./models/TagType');
      const Tag = require('./models/Tag');
      const RefreshToken = require('./models/RefreshToken');
      const {DataTypes} = require('sequelize');

      //Add FKs
      //User - Boards
      const fk_board_user = {
        foreignKey:{
          name: 'user_id',
          type: DataTypes.INTEGER(11),
          allowNull: false,
        }
      };
      User.hasMany(Board, fk_board_user);
      Board.belongsTo(User, fk_board_user);

      //Board - Tags
      const fk_tag_board = {
        foreignKey:{
          name: 'board_id',
          type: DataTypes.INTEGER(11),
          allowNull: false,
        }
      };
      Board.hasMany(Tag, fk_tag_board);
      Tag.belongsTo(Board, fk_tag_board);

      //Tags - TagType
      const fk_tag_tagtype = {
        foreignKey:{
          name: 'tag_type',
          type: DataTypes.INTEGER(11),
          allowNull: false,
        }
      };
      const fk_tag_previoustag = {
        foreignKey:{
          name: 'previous_tag',
          type: DataTypes.INTEGER(11),
          allowNull: true,
        },
        as: 'previous_tag_as',
      };
      const fk_tag_nexttag = {
        foreignKey:{
          name: 'next_tag',
          type: DataTypes.INTEGER(11),
          allowNull: true,
        },
        as: 'next_tag_as',
      };
      TagType.hasMany(Tag, fk_tag_tagtype);
      Tag.belongsTo(TagType, fk_tag_tagtype);

      //Previous tag
      Tag.belongsTo(Tag, fk_tag_previoustag);
      Tag.belongsTo(Tag, fk_tag_nexttag);

      //Sync
      sequelize.sync();
  })
  .catch(function (err) {
    console.log('Unable to connect to the database:', err);
  });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).json({info: "sorry, we can't understand this", err});
});

module.exports = app;
