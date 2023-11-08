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
    await queryInterface.removeColumn('Elections', 'start');
    await queryInterface.removeColumn('Elections', 'end');

    // Rename the new columns to match the original column names
    await queryInterface.renameColumn('Elections', 'start_new', 'start');
    await queryInterface.renameColumn('Elections', 'end_new', 'end');
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
