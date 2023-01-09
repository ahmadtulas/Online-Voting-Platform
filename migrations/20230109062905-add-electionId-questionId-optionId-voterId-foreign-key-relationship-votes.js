'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.addConstraint("Votes", {
      fields: ["electionId"],
      type: "foreign key",
      references: {
        table: "Elections",
        field: "id",
      },
    });
    await queryInterface.addConstraint("Votes", {
      fields: ["questionId"],
      type: "foreign key",
      references: {
        table: "Questions",
        field: "id",
      },
    });
    await queryInterface.addConstraint("Votes", {
      fields: ["optionId"],
      type: "foreign key",
      references: {
        table: "Options",
        field: "id",
      },
    });
    await queryInterface.addConstraint("Votes", {
      fields: ["voterId"],
      type: "foreign key",
      references: {
        table: "Voters",
        field: "id",
      },
    });

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
