const REQUIRED_PASSWORD_GROUPS = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "abcdefghijkmnopqrstuvwxyz",
  "23456789",
  "!@#$%&*?",
];

const getRandomIndex = (length) => {
  const cryptoObject = globalThis.crypto || globalThis.window?.crypto;

  if (cryptoObject?.getRandomValues) {
    const values = new Uint32Array(1);
    cryptoObject.getRandomValues(values);
    return values[0] % length;
  }

  return Math.floor(Math.random() * length);
};

export const validateStrongPassword = (password = "", { minLength = 10 } = {}) =>
  password.length >= minLength
  && /[a-z]/.test(password)
  && /[A-Z]/.test(password)
  && /\d/.test(password)
  && /[^A-Za-z0-9]/.test(password);

export const generateStrongPassword = ({ length = 14 } = {}) => {
  const targetLength = Math.max(length, REQUIRED_PASSWORD_GROUPS.length);
  const allCharacters = REQUIRED_PASSWORD_GROUPS.join("");
  const characters = REQUIRED_PASSWORD_GROUPS.map(
    (group) => group[getRandomIndex(group.length)]
  );

  while (characters.length < targetLength) {
    characters.push(allCharacters[getRandomIndex(allCharacters.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }

  return characters.join("");
};
