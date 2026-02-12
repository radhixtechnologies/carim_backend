
const { User } = require('../models'); 

async function findUserById( uid) {


  try {

    const user = await User.findByPk(uid);
    if (!user) throw new Error(`User with ID ${uid} not found`);

    return user;
  } catch (error) {
    throw error;
  }
}

module.exports = {findUserById}