function isValidSearchTerm(str) {
  str = str.trim();

  if (str.length === 0) {
    return false;
  }

  const specialChars = /[*@#%&()[\]{}\-_+=~`|\\:;"'<>,.?/^$\s]/g;
  const strWithoutSpecialChars = str.replace(specialChars, '');
  return strWithoutSpecialChars.length > 0;
}

module.exports = {
  isValidSearchTerm
}