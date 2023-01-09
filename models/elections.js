'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Elections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Elections.belongsTo(models.Users, {
        foreignKey: "userId",
      });
      Elections.hasMany(models.Questions, {
        foreignKey: "electionId",
      });
      Elections.hasMany(models.Voters, {
        foreignKey: "electionId",
      });
      Elections.hasMany(models.Votes, {
        foreignKey: "electionId",
      });
    }
    static findAllElectionOfUser(userId)
    {
      return this.findAll({where:{userId}});
    }
    static createNewElection(name, userId) {
      return this.create({
        name,
        start: false,
        end: false,
        userId,
      });
    }
  }
  Elections.init({
    name: DataTypes.STRING,
    start: DataTypes.STRING,
    end: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Elections',
  });
  return Elections;
};