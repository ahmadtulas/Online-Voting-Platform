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