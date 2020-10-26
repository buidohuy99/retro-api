const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Use env file
require('custom-env').env();

// Routers
const indexRouter = require('./routes/index');
const boardsRouter = require('./routes/boards');
app.use('/', indexRouter);
app.use('/boards', boardsRouter);

// Database check
const sequelize = require('./configs/sequelize');
sequelize.authenticate()
  .then((err) => {
      console.log('Connection has been established successfully.');
      const User = require('./models/User');
      const Board = require('./models/Board');
      const TagType = require('./models/TagType');
      const Tag = require('./models/Tag');
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
      TagType.hasMany(Tag, fk_tag_tagtype);
      Tag.belongsTo(TagType, fk_tag_tagtype);

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
  res.status(err.status || 500).send({info: "sorry, we can't understand this"});
});

module.exports = app;
