'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Questions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Questions.belongsTo(models.Elections, {
        foreignKey: "electionId",
      });
      Questions.hasMany(models.Options, {
        foreignKey: "questionId",
      });
      Questions.hasMany(models.Votes, {
        foreignKey: "questionId",
      });
    }
    static addQuestion(title, description, electionId) {
      return this.create({
        title,
        description,
        electionId,
      });
    }
  }
  Questions.init({
    title: DataTypes.STRING,
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Questions',
  });
  return Questions;
};