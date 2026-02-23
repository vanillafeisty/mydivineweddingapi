import { executeQuery } from "../config/database.js";
import { hashPassword } from "../utils/passwordUtils.js";
import { v4 as uuidv4 } from "uuid";

export const seedDatabase = async (req, res) => {
    try {
        // 1. CLEAR TABLES
        await executeQuery("SET FOREIGN_KEY_CHECKS = 0", []);
        await executeQuery("TRUNCATE TABLE admin_credentials", []);
        await executeQuery("TRUNCATE TABLE users", []);
        await executeQuery("TRUNCATE TABLE connections", []); 
        await executeQuery("SET FOREIGN_KEY_CHECKS = 1", []);

        const staffPass = await hashPassword("password@123");
        const superPass = await hashPassword("godmode123");

        await executeQuery("INSERT INTO admin_credentials (firstName, lastName, email, password, role_id) VALUES ('Super', 'Admin', 'superadmin@divine.com', ?, 1)", [superPass]);
        await executeQuery("INSERT INTO admin_credentials (firstName, lastName, email, password, role_id) VALUES ('Manoj', 'Admin', 'admin@divine.com', ?, 2)", [staffPass]);

        const allUsers = [
            { f: "Subash", l: "R", edu: "PhD Data Science", loc: "Chennai", cas: "Hindu, Iyer", rel: "Hindu", p: "platinum", g: 1, img: "male/10.jpg" },
            { f: "Thanush", l: "K", edu: "MBBS Doctor", loc: "Coimbatore", cas: "Vanniyar", rel: "Hindu", p: "diamond", g: 1, img: "male/25.jpg" },
            { f: "Kotai", l: "B", edu: "MBA Finance", loc: "Madurai", cas: "Mudaliar", rel: "Hindu", p: "gold", g: 1, img: "male/3.jpg" },
            { f: "Ramesh", l: "G", edu: "B.E. Mechanical", loc: "Trichy", cas: "BC", rel: "Christian", p: "platinum", g: 1, img: "male/44.jpg" },
            { f: "Vijay", l: "S", edu: "B.Arch Architect", loc: "Salem", cas: "General", rel: "Hindu", p: "diamond", g: 1, img: "male/5.jpg" },
            { f: "Divya", l: "M", edu: "M.Tech IT", loc: "Chennai", cas: "Iyer", rel: "Hindu", p: "platinum", g: 2, img: "female/12.jpg" },
            { f: "Karthika", l: "P", edu: "MBA HR", loc: "Coimbatore", cas: "Brahmin", rel: "Hindu", p: "diamond", g: 2, img: "female/8.jpg" },
            { f: "Gowri", l: "R", edu: "CA Professional", loc: "Madurai", cas: "Iyengar", rel: "Hindu", p: "gold", g: 2, img: "female/22.jpg" },
            { f: "Dhanya", l: "V", edu: "B.Tech IT", loc: "Salem", cas: "Vanniyar", rel: "Hindu", p: "diamond", g: 2, img: "female/2.jpg" },
            { f: "Leelavathi", l: "S", edu: "MBBS MS", loc: "Trichy", cas: "BC", rel: "Christian", p: "platinum", g: 2, img: "female/18.jpg" }
        ];

        for (const u of allUsers) {
            const email = `${u.f.toLowerCase()}@divine.com`;
            const mobile = `98765${u.g}000${allUsers.indexOf(u)}`;
            const hashedPass = await hashPassword(mobile); 
            
            await executeQuery(
                `INSERT INTO users (
                    first_name, last_name, username, email_address, mobile_no, 
                    password, education, location, caste, religion_id, 
                    gender_id, role_id, profile_photo, plan, status, dob
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3, ?, ?, 'active', '1995-01-01')`,
                [u.f, u.l, email, email, mobile, hashedPass, u.edu, u.loc, u.cas, (u.rel==='Hindu'?1:2), u.g, `https://xsgames.co/randomusers/assets/avatars/${u.img}`, u.p]
            );
        }

        
        const usersInDb = await executeQuery("SELECT profile_id, first_name FROM users WHERE role_id = 3", []);
        const getID = (name) => usersInDb.find(user => user.first_name === name).profile_id;

        const connections = [
            [getID('Subash'), getID('Divya')],
            [getID('Thanush'), getID('Karthika')],
            [getID('Kotai'), getID('Gowri')],
            [getID('Ramesh'), getID('Dhanya')],
            [getID('Vijay'), getID('Leelavathi')]
        ];

        for (const [sender, receiver] of connections) {
            await executeQuery("INSERT INTO connections (id, senderId, receiverId, status, createdAt) VALUES (UUID(), ?, ?, 'accepted', NOW())", [sender, receiver]);
        }

        res.json({ success: true, message: "Database Seeded." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Updates unique phone numbers for clients
 */
export const updateUniquePhones = async (req, res) => {
    try {
        const users = await executeQuery("SELECT profile_id FROM users WHERE role_id = 3", []);
        for (let i = 0; i < users.length; i++) {
            const uniquePhone = `98765${20000 + i}`;
            await executeQuery(
                "UPDATE users SET mobile_no = ? WHERE profile_id = ?",
                [uniquePhone, users[i].profile_id]
            );
        }
        res.json({ success: true, message: "Phone numbers updated to unique values." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};