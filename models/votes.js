'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Votes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Votes.belongsTo(models.Elections, {
        foreignKey: "electionId",
      });
      Votes.belongsTo(models.Questions, {
        foreignKey: "questionId",
      });
      Votes.belongsTo(models.Options, {
        foreignKey: "optionId",
      });
      Votes.belongsTo(models.Voters, {
        foreignKey: "voterId",
      });
    }
  }
  Votes.init({
    electionId: DataTypes.INTEGER,
    questionId: DataTypes.INTEGER,
    optionId: DataTypes.INTEGER,
    voterId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Votes',
  });
  return Votes;
};