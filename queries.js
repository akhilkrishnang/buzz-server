const Pool = require('pg').Pool;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'exp',
    password: 'adminakg',
    port: 5432
});

const getUsers = (request, response) => {
    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};

const getBuzzList = (request, response) => {
    pool.query('SELECT * FROM buzz ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};
const getParticipants = (request, response) => {
    const buzzNum = parseInt(request.params.buzzNum);
    pool.query(`
    SELECT p.id,u.id as user_id,u.name,u.emp_id,po.type as points 
    FROM points_pool p 
    LEFT JOIN users u ON p.user_id=u.id
    LEFT JOIN points po ON p.point_id = po.id     
    WHERE p.buzz_id = (SELECT id FROM buzz WHERE number =$1)
    `, [buzzNum], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};

module.exports = {
    getUsers,
    getBuzzList,
    getParticipants
}