/**
 * Represents a participating user in the chat.
 *
 * @param {string} id      - A unique ID for the user.
 * @param {object} options - An optional Hash of key, value pairs for this user.
 */
class User {
  constructor(id, options = {}) {
    this.id = id;
    let ref = options || {};
    for (let key of Object.keys(ref)) {
      this[key] = options[key];
    }
    this['name'] || (this['name'] = this.id.toString());
  }
}

export default User;
