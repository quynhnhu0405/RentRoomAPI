const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Utilities = sequelize.define(
  "Utilities",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "utilities",
    timestamps: true,
  }
);

module.exports = Utilities;
