import {
  executeQuery,
  initializeDatabase,
  getPool,
} from "../src/config/database.js";

const migrations = [
  {
    id: "001_create_users_table",
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        mobileNumber VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(500),
        role ENUM('self', 'parent', 'broker', 'admin', 'super_admin') DEFAULT 'self',
        gender ENUM('male', 'female', 'other'),
        status ENUM('pending', 'active', 'verified', 'blocked') DEFAULT 'pending',
        joinedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lastLogin TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email (email),
        KEY idx_status (status),
        KEY idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    id: "002_create_profiles_table",
    up: `
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL UNIQUE,
        age INT,
        height VARCHAR(10),
        heightCm INT,
        education VARCHAR(100),
        occupation VARCHAR(100),
        income VARCHAR(50),
        location VARCHAR(200),
        district VARCHAR(100),
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        pincode VARCHAR(10),
        
        -- Religious Details
        religion VARCHAR(50),
        caste VARCHAR(100),
        subCaste VARCHAR(100),
        gothram VARCHAR(100),
        raasi VARCHAR(50),
        nakshatra VARCHAR(50),
        star VARCHAR(50),
        lagnam VARCHAR(50),
        kulaDeivam VARCHAR(100),
        dosham VARCHAR(100),
        
        -- Astrological
        dateOfBirth DATE,
        timeOfBirth TIME,
        placeOfBirth VARCHAR(200),
        
        -- Family
        fatherName VARCHAR(100),
        motherName VARCHAR(100),
        fatherOccupation VARCHAR(100),
        motherOccupation VARCHAR(100),
        fatherJob VARCHAR(100),
        familyType VARCHAR(50),
        siblingsCount INT,
        
        -- Personal
        maritalStatus VARCHAR(50),
        motherTongue VARCHAR(50),
        about TEXT,
        hobbies JSON,
        
        -- Lifestyle
        diet VARCHAR(50),
        smoking VARCHAR(20),
        drinking VARCHAR(20),
        wakeUpTime TIME,
        sleepTime TIME,
        skills TEXT,
        extraCurricular TEXT,
        
        -- Documents
        horoscopeFile VARCHAR(500),
        bioDataFile VARCHAR(500),
        bioDataText TEXT,
        familyPhoto VARCHAR(500),
        images JSON,
        
        -- Verification
        isVerified BOOLEAN DEFAULT FALSE,
        isApproved BOOLEAN DEFAULT FALSE,
        isPremium BOOLEAN DEFAULT FALSE,
        lastActive TIMESTAMP,
        
        -- Contact
        mobileNumberVerified BOOLEAN DEFAULT FALSE,
        emailVerified BOOLEAN DEFAULT FALSE,
        
        -- Special Fields
        disabilities VARCHAR(50),
        lateMarriage VARCHAR(50),
        reMarriage VARCHAR(50),
        
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_religion (religion),
        KEY idx_caste (caste),
        KEY idx_location (location),
        KEY idx_age (age),
        KEY idx_verified (isVerified)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    id: "003_create_refresh_tokens_table",
    up: `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        token TEXT NOT NULL,
        expiresAt TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_user (userId),
        KEY idx_expires (expiresAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    id: "004_create_connections_table",
    up: `
      CREATE TABLE IF NOT EXISTS connections (
        id VARCHAR(36) PRIMARY KEY,
        senderId VARCHAR(36) NOT NULL,
        receiverId VARCHAR(36) NOT NULL,
        status ENUM('pending', 'accepted', 'rejected', 'blocked') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_status (status),
        KEY idx_receiver (receiverId),
        UNIQUE KEY unique_connection (senderId, receiverId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    id: "005_create_messages_table",
    up: `
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        senderId VARCHAR(36) NOT NULL,
        receiverId VARCHAR(36) NOT NULL,
        message TEXT,
        isRead BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_receiver (receiverId),
        KEY idx_created (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    id: "006_create_shortlist_table",
    up: `
      CREATE TABLE IF NOT EXISTS shortlist (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        profileId VARCHAR(36) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE,
        KEY idx_user (userId),
        UNIQUE KEY unique_shortlist (userId, profileId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    id: "007_create_verification_table",
    up: `
      CREATE TABLE IF NOT EXISTS verification (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL UNIQUE,
        aadhaarNumber VARCHAR(12),
        verificationStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        documentFile VARCHAR(500),
        verifiedAt TIMESTAMP,
        rejectionReason TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_status (verificationStatus)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    id: "008_create_activity_log_table",
    up: `
      CREATE TABLE IF NOT EXISTS activity_log (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        action VARCHAR(100),
        description TEXT,
        ipAddress VARCHAR(45),
        userAgent VARCHAR(500),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_user (userId),
        KEY idx_action (action),
        KEY idx_created (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
];

export const runMigrations = async () => {
  try {
    await initializeDatabase();

    // Create migrations table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(100) PRIMARY KEY,
        executedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Run each migration
    for (const migration of migrations) {
      const [executed] = await executeQuery(
        "SELECT id FROM migrations WHERE id = ?",
        [migration.id]
      );

      if (!executed || executed.length === 0) {
        try {
          await executeQuery(migration.up);
          await executeQuery("INSERT INTO migrations (id) VALUES (?)", [
            migration.id,
          ]);
          console.log(`✓ Migration ${migration.id} executed successfully`);
        } catch (error) {
          console.error(`✗ Migration ${migration.id} failed:`, error.message);
          throw error;
        }
      } else {
        console.log(`⊘ Migration ${migration.id} already executed`);
      }
    }

    console.log("\n✓ All migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

// Run migrations when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
