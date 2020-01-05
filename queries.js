require('dotenv').config();
const Pool = require('pg').Pool;
const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
    sslmode : 'require',
    ssl : 'true',
    sslfactory:'org.postgresql.ssl.NonValidatingFactory'
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
    WHERE p.buzz_id = (SELECT id FROM buzz WHERE number =$1) AND p.is_deleted !=true
    `, [buzzNum], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};

const updateParticipants = (request, response) => {
    let data =  request.body;
    (async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          if(data.toAdd && data.toAdd.length>0){
            await client.query(getInsertQuery(data.toAdd));
          }
          if(data.toUpdate && data.toUpdate.length>0){
            await client.query(getUpdateQuery(data.toUpdate));
          }
          if(data.toDelete && data.toDelete.length>0){
            await client.query(getDeleteQuery(data.toDelete));
          } 
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
          response.status(200).json([]);
        }
      })().catch(e => console.error(e.stack))
};

const getInsertQuery = (data) => {
    let query = "INSERT INTO points_pool(user_id,buzz_id,point_id) VALUES ";
    let valueList = [];
    for(let z=0,zLen=data.length; z<zLen; z++){
        valueList.push(`(${data[z].userId},${data[z].buzzId},${data[z].pointId})`);
    }
    query += valueList.join(",");
    return query;
};

const getUpdateQuery = (data) => {
    let queryP1 = `update points_pool as pp set
                    user_id = v.user_id,
                    buzz_id = v.buzz_id,
                    point_id = v.point_id
                from (values `;
    let queryP2 = ` ) as v(id, user_id, buzz_id, point_id)
                where v.id = pp.id;`
    let valueList = [];
    for(let z=0,zLen=data.length; z<zLen; z++){
        valueList.push(`(${data[z].id},${data[z].userId},${data[z].buzzId},${data[z].pointId})`);
    }
    return queryP1 + valueList.join(",") + queryP2;
};

const getDeleteQuery = (data) => {
    let query = `update points_pool set is_deleted = true WHERE id IN(${data.join(",")})`;
    return query;
};

const getLoginInfo = (username,callback) => {
    let query = `select ul.password, u.id, u.name, u.emp_id
    from user_login ul
    left join users u on ul.user_id = u.id
    where ul.username='${username}'`;
    pool.query(query, (error, results) => {
        if (error) {
            throw error;
        }
        callback(results.rows);
    });
}

const updateLastLoginTime = (username) => {
    let query = `update user_login set last_login = CURRENT_TIMESTAMP where username ='${username}'`;
    pool.query(query, (error, results) => {
        if (error) {
            throw error;
        }
    });
}

module.exports = {
    getUsers,
    getBuzzList,
    getParticipants,
    updateParticipants,
    getLoginInfo,
    updateLastLoginTime
}