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
        onDelete: 'CASCADE',
        hooks: true
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
    updateElection(name) {
      return this.update({ name });
    }
    
    async doesElectionHaveEnoughQuestions(electionId) {
      const election = await Elections.getElectionWithDetails(electionId);
    
      return election.Questions.length === 0;
    }
    
    async doesElectionHaveEnoughOptions(electionId) {
      const election = await Elections.getElectionWithDetails(electionId);
    
      const questions = election.Questions;
      return questions.some((question) => question.Options.length < 2);
    }
    
    async doesElectionHaveEnoughVoters(electionId) {
      const election = await Elections.getElectionWithDetails(electionId);
      //console.log("Election Data at Model level:", election);

      return election.Voters.length >= 2;
    }
    
    static async getElectionWithDetails(electionId) {
      return Elections.findByPk(electionId, {
        include: [
          {
            model: sequelize.models.Questions,
            include: sequelize.models.Options,
          },
          { model: sequelize.models.Voters, include: sequelize.models.Votes },
        ],
      });
    }

    setElectionStart(start) {
      return this.update({ start });
    }
    setElectionEnd(end) {
      return this.update({ end });
    }
      
    static async removeElectionByID(id, userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }
  }
  Elections.init({
    name: DataTypes.STRING,
    start: DataTypes.BOOLEAN,
    end: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Elections',
  });
  return Elections;
};