import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10");

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

export const generateOTP = (length = 6) => {
  return Math.floor(
    Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
  )
    .toString()
    .slice(0, length);
};

export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  if (password.length < minLength) {
    return {
      valid: false,
      error: "Password must be at least 8 characters long",
    };
  }
  if (!hasUpperCase) {
    return {
      valid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }
  if (!hasLowerCase) {
    return {
      valid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }
  if (!hasNumbers) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  if (!hasSpecialChar) {
    return {
      valid: false,
      error: "Password must contain at least one special character (!@#$%^&*)",
    };
  }

  return { valid: true };
};
